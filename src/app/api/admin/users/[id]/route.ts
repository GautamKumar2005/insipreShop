export const runtime = "nodejs";
import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import Product from "@/models/Product";
import Review from "@/models/Review";
import Cart from "@/models/Cart";
import DeletedUser from "@/models/DeletedUser";
import { success, error } from "@/lib/response";
import { ROLES } from "@/lib/constants";
import { pool } from "@/lib/supabase-db";

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const role = req.headers.get("x-user-role");
    const adminId = req.headers.get("x-user-id") || "admin";
    if (role !== ROLES.ADMIN) return error("Unauthorized", 403);

    const { id: userId } = await context.params;

    // Fetch user
    const targetUser = await User.findById(userId);
    if (!targetUser) return error("User not found", 404);

    // Safeguard: Do not delete other admin users
    if (targetUser.role === ROLES.ADMIN) {
      return error("Cannot delete admin users", 400);
    }

    // 1. Fetch products count and reviews count in MongoDB
    const productsCount = await Product.countDocuments({ seller: userId });
    const reviewsCount = await Review.countDocuments({ user: userId });

    // 2. Fetch social posts and comments from Supabase Postgres
    const postsRes = await pool.query("SELECT id FROM social_posts WHERE user_id = $1", [userId]);
    const commentsRes = await pool.query("SELECT id FROM social_comments WHERE user_id = $1", [userId]);

    // 3. Create the archived DeletedUser profile
    await DeletedUser.create({
      originalUserId: userId,
      name: targetUser.name,
      email: targetUser.email,
      phone: targetUser.phone,
      role: targetUser.role,
      createdAt: targetUser.createdAt,
      deletedAt: new Date(),
      deletedBy: adminId,
      archivedData: {
        productsCount,
        socialPostsCount: postsRes.rows.length,
        reviewsCount,
        commentsCount: commentsRes.rows.length,
        profile: targetUser.toObject()
      }
    });

    // 4. Clean/Delete related entities from MongoDB
    await Product.deleteMany({ seller: userId });
    await Review.deleteMany({ user: userId });
    await Cart.deleteMany({ user: userId });
    await User.findByIdAndDelete(userId);

    // 5. Clean/Delete related entities from Supabase Postgres
    await pool.query("DELETE FROM social_posts WHERE user_id = $1", [userId]);
    await pool.query("DELETE FROM social_comments WHERE user_id = $1", [userId]);
    await pool.query("DELETE FROM social_likes WHERE user_id = $1", [userId]);
    await pool.query("DELETE FROM social_views WHERE user_id = $1", [userId]);
    await pool.query("DELETE FROM social_follows WHERE follower_id = $1 OR following_id = $2", [userId, userId]);
    await pool.query("DELETE FROM social_notifications WHERE recipient_id = $1 OR sender_id = $2", [userId, userId]);
    await pool.query("DELETE FROM social_messages WHERE sender_id = $1 OR receiver_id = $2", [userId, userId]);

    return success({ message: "User and all related data purged and archived successfully." });
  } catch (err: any) {
    return error(err.message || "Failed to delete user", 500);
  }
}
