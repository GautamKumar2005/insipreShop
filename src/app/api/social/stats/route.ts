export const runtime = "nodejs";
import { NextRequest } from "next/server";
import { success, error } from "@/lib/response";
import { pool } from "@/lib/supabase-db";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return error("userId is required", 400);
    }

    const followersRes = await pool.query("SELECT COUNT(*) FROM social_follows WHERE following_id = $1", [userId]);
    const followingRes = await pool.query("SELECT COUNT(*) FROM social_follows WHERE follower_id = $1", [userId]);
    const postsRes = await pool.query("SELECT COUNT(*) FROM social_posts WHERE user_id = $1", [userId]);

    return success({
      followers: parseInt(followersRes.rows[0].count),
      following: parseInt(followingRes.rows[0].count),
      posts: parseInt(postsRes.rows[0].count)
    });
  } catch (err: any) {
        return error(err.message || "Failed to fetch stats");
  }
}
