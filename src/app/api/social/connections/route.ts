import { NextRequest } from "next/server";
import { pool } from "@/lib/supabase-db";
import { success, error } from "@/lib/response";
import { verifyAccessToken } from "@/lib/jwt";
import { connectDB } from "@/lib/db";
import User from "@/models/User";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/social/connections?userId=...&type=accepted|pending|status&targetUserId=...
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const type = searchParams.get("type") || "accepted";
    const targetUserId = searchParams.get("targetUserId");

    if (!userId) {
      return error("userId is required", 400);
    }

    await connectDB();

    if (type === "status" && targetUserId) {
      // Check status of connection between userId and targetUserId
      const u1 = userId < targetUserId ? userId : targetUserId;
      const u2 = userId < targetUserId ? targetUserId : userId;
      
      const res = await pool.query(
        "SELECT * FROM social_connections WHERE user_id_1 = $1 AND user_id_2 = $2",
        [u1, u2]
      );
      
      if (res.rows.length === 0) {
        return success({ status: "none" });
      }
      
      const connection = res.rows[0];
      return success({
        status: connection.status, // 'pending' or 'accepted'
        sender_id: connection.sender_id
      });
    }

    let query = "";
    let params: any[] = [userId];

    if (type === "pending") {
      // Pending requests incoming to the user
      query = `
        SELECT * FROM social_connections 
        WHERE status = 'pending' 
        AND (user_id_1 = $1 OR user_id_2 = $1) 
        AND sender_id != $1
        ORDER BY created_at DESC
      `;
    } else {
      // Accepted connections
      query = `
        SELECT * FROM social_connections 
        WHERE status = 'accepted' 
        AND (user_id_1 = $1 OR user_id_2 = $1)
        ORDER BY created_at DESC
      `;
    }

    const { rows } = await pool.query(query, params);

    if (rows.length === 0) {
      return success([]);
    }

    // Get the other user's ID for each connection
    const oppositeIds = rows.map((r: any) => {
      return r.user_id_1 === userId ? r.user_id_2 : r.user_id_1;
    });

    const dbUsers = await User.find({ _id: { $in: oppositeIds } }).select("name profilePhoto username");
    const userMap = dbUsers.reduce((acc: any, u: any) => {
      acc[u._id.toString()] = {
        _id: u._id.toString(),
        name: u.name,
        avatar: u.profilePhoto?.url || null,
        username: u.username || `user_${u._id.toString().slice(-6)}`
      };
      return acc;
    }, {});

    const enrichedConnections = rows.map((r: any) => {
      const oppositeId = r.user_id_1 === userId ? r.user_id_2 : r.user_id_1;
      return {
        id: r.id,
        status: r.status,
        sender_id: r.sender_id,
        created_at: r.created_at,
        user: userMap[oppositeId] || { _id: oppositeId, name: "Unknown User", avatar: null, username: "unknown" }
      };
    });

    return success(enrichedConnections);

  } catch (err: any) {
    return error(err.message || "Failed to fetch connections");
  }
}

// POST /api/social/connections
export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return error("Unauthorized", 401);
    }

    const token = authHeader.split(" ")[1];
    const decoded = verifyAccessToken(token) as any;
    if (!decoded || !decoded.id) {
      return error("Invalid token", 401);
    }

    const authId = decoded.id;
    const { targetUserId, action } = await req.json();

    if (!targetUserId) {
      return error("targetUserId is required", 400);
    }

    if (authId === targetUserId) {
      return error("You cannot connect with yourself", 400);
    }

    const u1 = authId < targetUserId ? authId : targetUserId;
    const u2 = authId < targetUserId ? targetUserId : authId;

    if (action === "request") {
      // Check if already exists
      const check = await pool.query(
        "SELECT * FROM social_connections WHERE user_id_1 = $1 AND user_id_2 = $2",
        [u1, u2]
      );
      if (check.rows.length > 0) {
        return error("Connection request already exists or already connected", 400);
      }

      await pool.query(
        "INSERT INTO social_connections (user_id_1, user_id_2, status, sender_id) VALUES ($1, $2, 'pending', $3)",
        [u1, u2, authId]
      );

      // Create notification
      await pool.query(
        "INSERT INTO social_notifications (recipient_id, sender_id, type) VALUES ($1, $2, 'connect_request')",
        [targetUserId, authId]
      );

      return success({ status: "pending", sender_id: authId });
    } 
    
    if (action === "accept") {
      const res = await pool.query(
        "UPDATE social_connections SET status = 'accepted' WHERE user_id_1 = $1 AND user_id_2 = $2 RETURNING *",
        [u1, u2]
      );

      if (res.rows.length === 0) {
        return error("No pending connection request found", 404);
      }

      // Create notification for acceptance
      await pool.query(
        "INSERT INTO social_notifications (recipient_id, sender_id, type) VALUES ($1, $2, 'connect_accept')",
        [targetUserId, authId]
      );

      return success({ status: "accepted" });
    } 
    
    if (action === "decline" || action === "disconnect") {
      const res = await pool.query(
        "DELETE FROM social_connections WHERE user_id_1 = $1 AND user_id_2 = $2 RETURNING *",
        [u1, u2]
      );

      if (res.rows.length === 0) {
        return error("No connection or request found", 404);
      }

      return success({ status: "none" });
    }

    return error("Invalid action", 400);

  } catch (err: any) {
    return error(err.message || "Failed to process connection action");
  }
}
