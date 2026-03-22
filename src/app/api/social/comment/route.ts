export const runtime = "nodejs";
import { NextRequest } from "next/server";
import { pool } from "@/lib/supabase-db";
import { success, error } from "@/lib/response";
import { verifyAccessToken } from "@/lib/jwt";
import { connectDB } from "@/lib/db";
import User from "@/models/User";

// Get comments for a post
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const postId = searchParams.get("postId");
    if (!postId) return error("Post ID is required", 400);

    const commentsRes = await pool.query(
      "SELECT * FROM social_comments WHERE post_id = $1 ORDER BY created_at DESC",
      [postId]
    );

    const userIds = Array.from(new Set(commentsRes.rows.map((c: any) => c.user_id)));
    if (userIds.length === 0) return success([]);

    await connectDB();
    const users = await User.find({ _id: { $in: userIds } }).select("name profilePhoto _id");
    
    const result = commentsRes.rows.map((c: any) => {
        const u = users.find((user: any) => user._id.toString() === c.user_id);
        return {
            ...c,
            user: {
                id: c.user_id,
                name: u?.name || "Unknown",
                avatar: u?.profilePhoto?.url || null
            }
        };
    });

    return success(result);
  } catch (err: any) {
    return error(err.message || "Failed to fetch comments", 500);
  }
}

// Add a comment
export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) return error("Unauthorized", 401);
    const decoded = verifyAccessToken(authHeader.split(" ")[1]) as any;
    if (!decoded || !decoded.id) return error("Unauthorized", 401);

    const { postId, content } = await req.json();
    if (!postId || !content) return error("Post ID and content are required", 400);

    const res = await pool.query(
      "INSERT INTO social_comments (post_id, user_id, content) VALUES ($1, $2, $3) RETURNING *",
      [postId, decoded.id, content]
    );

    return success(res.rows[0]);
  } catch (err: any) {
    return error(err.message || "Failed to add comment", 500);
  }
}
