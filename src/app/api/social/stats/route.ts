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

    const connectionsRes = await pool.query(
      "SELECT COUNT(*) FROM social_connections WHERE status = 'accepted' AND (user_id_1 = $1 OR user_id_2 = $1)",
      [userId]
    );
    const pendingRes = await pool.query(
      "SELECT COUNT(*) FROM social_connections WHERE status = 'pending' AND (user_id_1 = $1 OR user_id_2 = $1) AND sender_id != $1",
      [userId]
    );
    const postsRes = await pool.query("SELECT COUNT(*) FROM social_posts WHERE user_id = $1", [userId]);

    return success({
      connections: parseInt(connectionsRes.rows[0].count),
      pendingRequests: parseInt(pendingRes.rows[0].count),
      posts: parseInt(postsRes.rows[0].count)
    });
  } catch (err: any) {
    return error(err.message || "Failed to fetch stats");
  }
}
