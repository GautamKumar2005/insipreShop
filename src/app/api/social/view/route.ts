export const runtime = "nodejs";
import { NextRequest } from "next/server";
import { pool } from "@/lib/supabase-db";
import { success, error } from "@/lib/response";
import { verifyAccessToken } from "@/lib/jwt";

// Mark a post as viewed
export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    const { postId } = await req.json();
    if (!postId) return error("Post ID is required", 400);

    let userId = "guest_" + Math.random().toString(36).substring(7);
    if (authHeader && authHeader.startsWith("Bearer ")) {
      try {
        const decoded = verifyAccessToken(authHeader.split(" ")[1]) as any;
        if (decoded && decoded.id) userId = decoded.id;
      } catch (e) {}
    }

    // Upsert view
    await pool.query(
      "INSERT INTO social_views (post_id, user_id) VALUES ($1, $2) ON CONFLICT (post_id, user_id) DO NOTHING",
      [postId, userId]
    );

    // Get exact new count to return
    const viewsRes = await pool.query("SELECT COUNT(*) FROM social_views WHERE post_id = $1", [postId]);
    const newCount = parseInt(viewsRes.rows[0].count);

    return success({ viewed: true, viewsCount: newCount });
  } catch (err: any) {
    return error(err.message || "Failed to record view", 500);
  }
}

import { connectDB } from "@/lib/db";
import User from "@/models/User";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const postId = searchParams.get("postId");
    if (!postId) return error("postId is required", 400);

    const viewsRes = await pool.query(
      "SELECT user_id FROM social_views WHERE post_id = $1 AND user_id != 'guest'",
      [postId]
    );

    const userIds = viewsRes.rows.map(r => r.user_id);
    const validIds = userIds.filter(id => /^[0-9a-fA-F]{24}$/.test(id));
    if (validIds.length === 0) return success([]);

    await connectDB();
    const users = await User.find({ _id: { $in: validIds } }).select("name profilePhoto _id username");

    const result = users.map(u => ({
      id: u._id.toString(),
      name: u.name,
      username: u.username || `user_${u._id.toString().substring(0,6)}`,
      avatar: u.profilePhoto?.url || null
    }));

    return success(result);
  } catch (err: any) {
    return error(err.message || "Failed to get views");
  }
}
