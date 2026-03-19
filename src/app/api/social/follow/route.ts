export const runtime = "nodejs";
import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import { success, error } from "@/lib/response";
import { pool } from "@/lib/supabase-db";

import { verifyAccessToken } from "@/lib/jwt";

export async function POST(req: NextRequest) {
  try {
    let currentUserId = req.headers.get("x-user-id");
    
    // Fallback to manual token verification if middleware missed it
    if (!currentUserId) {
      const authHeader = req.headers.get("authorization");
      if (authHeader && authHeader.startsWith("Bearer ")) {
        const token = authHeader.split(" ")[1];
        const decoded = verifyAccessToken(token) as any;
        if (decoded && decoded.id) {
          currentUserId = decoded.id;
        }
      }
    }

    if (!currentUserId) return error("Unauthorized", 401);

    const { targetUserId } = await req.json();
    if (!targetUserId) return error("Target user ID is required", 400);

    if (currentUserId === targetUserId) {
      return error("You cannot follow yourself", 400);
    }

    await connectDB();

    const currentUser = await User.findById(currentUserId);
    const targetUser = await User.findById(targetUserId);

    if (!currentUser || !targetUser) {
      return error("User not found", 404);
    }

    // Check if following in Supabase
    const checkRes = await pool.query(
      "SELECT 1 FROM social_follows WHERE follower_id = $1 AND following_id = $2",
      [currentUserId, targetUserId]
    );

    const isFollowing = checkRes.rows.length > 0;

    if (isFollowing) {
      await pool.query(
        "DELETE FROM social_follows WHERE follower_id = $1 AND following_id = $2",
        [currentUserId, targetUserId]
      );
    } else {
      await pool.query(
        "INSERT INTO social_follows (follower_id, following_id) VALUES ($1, $2)",
        [currentUserId, targetUserId]
      );
    }

    // Get updated counts
    const followersRes = await pool.query(
      "SELECT COUNT(*) FROM social_follows WHERE following_id = $1",
      [targetUserId]
    );
    const followingRes = await pool.query(
      "SELECT COUNT(*) FROM social_follows WHERE follower_id = $1",
      [targetUserId]
    );
    const myFollowingRes = await pool.query(
      "SELECT COUNT(*) FROM social_follows WHERE follower_id = $1",
      [currentUserId]
    );

    return success({
      isFollowing: !isFollowing,
      followersCount: parseInt(followersRes.rows[0].count),
      followingCount: parseInt(followingRes.rows[0].count),
      myFollowingCount: parseInt(myFollowingRes.rows[0].count)
    });
  } catch (err: any) {
    return error(err.message || "Failed to update follow status", 500);
  }
}
