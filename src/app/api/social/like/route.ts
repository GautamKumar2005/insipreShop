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
      return success({ liked: false });
    } else {
      await pool.query("INSERT INTO social_likes (post_id, user_id) VALUES ($1, $2)", [postId, decoded.id]);
      return success({ liked: true });
    }
  } catch (err: any) {
    return error(err.message || "Failed to toggle like", 500);
  }
}
