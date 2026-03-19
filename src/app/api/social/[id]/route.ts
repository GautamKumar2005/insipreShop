export const runtime = "nodejs";
import { NextRequest } from "next/server";
import { pool } from "@/lib/supabase-db";
import { success, error } from "@/lib/response";
import { verifyAccessToken } from "@/lib/jwt";
import { connectDB } from "@/lib/db";
import UserProfile from "@/models/User";

// Helper to authenticate user
const authenticate = (req: NextRequest) => {
  const authHeader = req.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;
  const token = authHeader.split(" ")[1];
  try {
    return verifyAccessToken(token) as any;
  } catch (e) {
    return null;
  }
};

// GET to retrieve post details
export async function GET(req: NextRequest, segmentData: { params: Promise<{ id: string }> }) {
  try {
    const { id: postId } = await segmentData.params;

    const res = await pool.query(`
      SELECT p.*, 
      (SELECT COUNT(*) FROM social_likes WHERE post_id = p.id) as likes_count,
      (SELECT COUNT(*) FROM social_comments WHERE post_id = p.id) as comments_count,
      (SELECT COUNT(*) FROM social_views WHERE post_id = p.id) as views_count
      FROM social_posts p
      WHERE id = $1
    `, [postId]);

    if (res.rows.length === 0) return error("Post not found", 404);

    const post = res.rows[0];

    // Fetch user info from MongoDB
    await connectDB();
    const poster = await UserProfile.findById(post.user_id).select("name profilePhoto username");
    
    return success({
      ...post,
      user: poster ? {
        name: poster.name,
        avatar: poster.profilePhoto?.url || null,
        username: poster.username
      } : null
    });
  } catch (err: any) {
        return error("Internal error", 500);
  }
}

// PUT to edit post
export async function PUT(req: NextRequest, segmentData: { params: Promise<{ id: string }> }) {
  try {
    const decoded = authenticate(req);
    if (!decoded || !decoded.id) return error("Unauthorized", 401);

    const { id: postId } = await segmentData.params;
    const body = await req.json();
    const { content } = body;

    if (!content) return error("Content is required", 400);

    // Verify ownership
    const checkRes = await pool.query("SELECT user_id FROM social_posts WHERE id = $1", [postId]);
    if (checkRes.rows.length === 0) return error("Post not found", 404);
    if (checkRes.rows[0].user_id !== decoded.id) return error("Forbidden", 403);

    // Update
    const updateRes = await pool.query(
      "UPDATE social_posts SET content = $1 WHERE id = $2 RETURNING *",
      [content, postId]
    );

    return success(updateRes.rows[0]);
  } catch (err: any) {
        return error(err.message || "Failed to update post", 500);
  }
}

// DELETE to remove post
export async function DELETE(req: NextRequest, segmentData: { params: Promise<{ id: string }> }) {
  try {
    const decoded = authenticate(req);
    if (!decoded || !decoded.id) return error("Unauthorized", 401);

    const { id: postId } = await segmentData.params;

    // Verify ownership
    const checkRes = await pool.query("SELECT user_id FROM social_posts WHERE id = $1", [postId]);
    if (checkRes.rows.length === 0) return error("Post not found", 404);
    if (checkRes.rows[0].user_id !== decoded.id) return error("Forbidden", 403);

    // Cleanup likes, comments, views
    await pool.query("DELETE FROM social_likes WHERE post_id = $1", [postId]);
    await pool.query("DELETE FROM social_comments WHERE post_id = $1", [postId]);
    await pool.query("DELETE FROM social_views WHERE post_id = $1", [postId]);
    
    // Finally delete post
    await pool.query("DELETE FROM social_posts WHERE id = $1", [postId]);

    return success({ deleted: true });
  } catch (err: any) {
        return error(err.message || "Failed to delete post", 500);
  }
}
