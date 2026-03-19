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

    let userId = "guest";
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const decoded = verifyAccessToken(authHeader.split(" ")[1]) as any;
      if (decoded && decoded.id) userId = decoded.id;
    }

    // Upsert view
    await pool.query(
      "INSERT INTO social_views (post_id, user_id) VALUES ($1, $2) ON CONFLICT (post_id, user_id) DO NOTHING",
      [postId, userId]
    );

    return success({ viewed: true });
  } catch (err: any) {
    return error(err.message || "Failed to record view", 500);
  }
}
