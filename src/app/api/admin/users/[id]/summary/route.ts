export const runtime = "nodejs";
import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import Order from "@/models/Order";
import Product from "@/models/Product";
import Review from "@/models/Review";
import UserActivity from "@/models/UserActivity";
import { success, error } from "@/lib/response";
import { ROLES } from "@/lib/constants";
import { pool } from "@/lib/supabase-db";

// Helper to aggregate stats
async function aggregateUserStats(userId: string, email: string, role: string) {
  const activities = await UserActivity.find({ email }).sort({ timestamp: -1 });

  const totalSeconds = activities.reduce((sum, act) => sum + (act.duration || 0), 0);
  const totalMinutesSpent = Math.round(totalSeconds / 60);

  const hourCounts = Array(24).fill(0);
  activities.forEach(act => {
    const hr = new Date(act.timestamp).getHours();
    hourCounts[hr] += 1;
  });
  let peakHour = 0;
  let maxCount = 0;
  for (let i = 0; i < 24; i++) {
    if (hourCounts[i] > maxCount) {
      maxCount = hourCounts[i];
      peakHour = i;
    }
  }
  const peakHourStr = maxCount > 0 ? `${peakHour}:00 - ${(peakHour + 1) % 24}:00` : "No activity logs";

  let productsCount = 0;
  let ordersCount = 0;
  let moneyTotal = 0;
  let reviewsCount = 0;
  let deliveriesCount = 0;

  if (role === "buyer") {
    const orders = await Order.find({ buyer: userId });
    ordersCount = orders.length;
    moneyTotal = orders.reduce((sum, o) => sum + o.totalAmount, 0);
    reviewsCount = await Review.countDocuments({ user: userId });
  } else if (role === "seller") {
    productsCount = await Product.countDocuments({ seller: userId });
    const orders = await Order.find({ seller: userId });
    ordersCount = orders.length;
    moneyTotal = orders.reduce((sum, o) => sum + o.totalAmount, 0);
  } else if (role === "delivery") {
    deliveriesCount = await Order.countDocuments({ delivery: userId, status: "DELIVERED" });
  }

  let socialPostsCount = 0;
  let socialLikesCount = 0;
  let socialCommentsCount = 0;

  try {
    const postsRes = await pool.query("SELECT COUNT(*) as count FROM social_posts WHERE user_id = $1", [userId]);
    socialPostsCount = parseInt(postsRes.rows[0]?.count || "0");

    const likesRes = await pool.query("SELECT COUNT(*) as count FROM social_likes WHERE user_id = $1", [userId]);
    socialLikesCount = parseInt(likesRes.rows[0]?.count || "0");

    const commentsRes = await pool.query("SELECT COUNT(*) as count FROM social_comments WHERE user_id = $1", [userId]);
    socialCommentsCount = parseInt(commentsRes.rows[0]?.count || "0");
  } catch (pgErr) {
    console.error("PG query error inside summary:", pgErr);
  }

  return {
    totalMinutesSpent,
    peakHour: peakHourStr,
    productsCount,
    ordersCount,
    moneyTotal,
    reviewsCount,
    deliveriesCount,
    socialPostsCount,
    socialLikesCount,
    socialCommentsCount,
  };
}

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const role = req.headers.get("x-user-role");
    if (role !== ROLES.ADMIN) return error("Unauthorized", 403);

    const { id: userId } = await context.params;

    const user = await User.findById(userId);
    if (!user) return error("User not found", 404);

    const stats = await aggregateUserStats(userId, user.email, user.role);

    return success({
      profile: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        createdAt: user.createdAt,
      },
      stats
    });
  } catch (err: any) {
    return error(err.message || "Failed to fetch user summary", 500);
  }
}
