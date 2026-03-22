export const runtime = "nodejs";
import { NextRequest } from "next/server";
import { pool } from "@/lib/supabase-db";
import { success, error } from "@/lib/response";
import { verifyAccessToken } from "@/lib/jwt";

// Like or unlike a post
export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) return error("Unauthorized", 401);
    const decoded = verifyAccessToken(authHeader.split(" ")[1]) as any;
    if (!decoded || !decoded.id) return error("Unauthorized", 401);

    const { postId } = await req.json();
    if (!postId) return error("Post ID is required", 400);

    // Check if liked
    const checkLiked = await pool.query(
      "SELECT id FROM social_likes WHERE post_id = $1 AND user_id = $2",
      [postId, decoded.id]
    );

    if (checkLiked.rows.length > 0) {
      await pool.query("DELETE FROM social_likes WHERE post_id = $1 AND user_id = $2", [postId, decoded.id]);
      const countsResp = await pool.query("SELECT COUNT(*) FROM social_likes WHERE post_id = $1", [postId]);
      return success({ liked: false, likesCount: parseInt(countsResp.rows[0].count) });
    } else {
      await pool.query("INSERT INTO social_likes (post_id, user_id) VALUES ($1, $2)", [postId, decoded.id]);
      const countsResp = await pool.query("SELECT COUNT(*) FROM social_likes WHERE post_id = $1", [postId]);
      return success({ liked: true, likesCount: parseInt(countsResp.rows[0].count) });
    }
  } catch (err: any) {
    return error(err.message || "Failed to toggle like", 500);
  }
}

import { connectDB } from "@/lib/db";
import User from "@/models/User";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const postId = searchParams.get("postId");
    if (!postId) return error("postId is required", 400);

    const likesRes = await pool.query(
      "SELECT user_id FROM social_likes WHERE post_id = $1 ORDER BY created_at DESC",
      [postId]
    );

    const userIds = likesRes.rows.map(r => r.user_id);
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
    return error(err.message || "Failed to get likes");
  }
}
