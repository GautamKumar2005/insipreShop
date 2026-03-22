import { NextRequest } from "next/server";
import { pool } from "@/lib/supabase-db";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import SellerProfile from "@/models/SellerProfile";
import DeliveryProfile from "@/models/DeliveryProfile";
import Order from "@/models/Order";
import { success, error } from "@/lib/response";
import { ROLES } from "@/lib/constants";

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const role = req.headers.get("x-user-role");
    if (role !== ROLES.ADMIN) return error("Unauthorized", 403);

    const totalUsers = await User.countDocuments();
    const totalSellers = await SellerProfile.countDocuments();
    const totalDelivery = await DeliveryProfile.countDocuments();
    const totalOrders = await Order.countDocuments();

    // Recent Users
    const recentUsers = await User.find()
      .select("name email role createdAt")
      .sort({ createdAt: -1 })
      .limit(5);

    const recentOrders = await Order.find()
      .select("totalAmount status createdAt paymentStatus")
      .sort({ createdAt: -1 })
      .limit(5);

    // Dynamic Chart Data (Last 7 Days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Aggregate Orders
    const ordersByDay = await Order.aggregate([
      { $match: { createdAt: { $gte: sevenDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 },
        },
      },
    ]);

    // Aggregate Users
    const usersByDay = await User.aggregate([
      { $match: { createdAt: { $gte: sevenDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 },
        },
      },
    ]);

    // Social Data Aggregations
    let socialMetrics = {
        highestLikedPost: null,
        highestViewedPost: null,
        highestSharedPost: null,
        totalPosts: 0
    };
    
    try {
        const topLiked = await pool.query(`SELECT p.*, COUNT(l.id) as interactions FROM social_posts p JOIN social_likes l ON p.id = l.post_id GROUP BY p.id ORDER BY interactions DESC LIMIT 1`);
        const topViewed = await pool.query(`SELECT p.*, COUNT(v.id) as interactions FROM social_posts p JOIN social_views v ON p.id = v.post_id GROUP BY p.id ORDER BY interactions DESC LIMIT 1`);
        const topShared = await pool.query(`
            SELECT 
                SUBSTRING(content FROM 'Check out this post: .*/social/post/(.*)') as post_id, 
                COUNT(*) as interactions 
            FROM social_messages 
            WHERE content LIKE 'Check out this post:%' 
            GROUP BY post_id 
            ORDER BY interactions DESC 
            LIMIT 1
        `);
        const totalPosts = await pool.query(`SELECT COUNT(*) as count FROM social_posts`);
        
        socialMetrics.totalPosts = parseInt(totalPosts.rows[0]?.count || 0);

        if (topLiked.rows.length > 0) {
            socialMetrics.highestLikedPost = topLiked.rows[0];
        }
        if (topViewed.rows.length > 0) {
            socialMetrics.highestViewedPost = topViewed.rows[0];
        }
        if (topShared.rows.length > 0 && topShared.rows[0].post_id) {
            const sharedPost = await pool.query(`SELECT * FROM social_posts WHERE id = $1`, [topShared.rows[0].post_id]);
            if (sharedPost.rows.length > 0) {
                socialMetrics.highestSharedPost = { ...sharedPost.rows[0], interactions: parseInt(topShared.rows[0].interactions) };
            }
        }
    } catch(e) {}

    // Generate dates for the last 7 days
    const chartData = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      const monthDayStr = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });

      const orderCount = ordersByDay.find((o) => o._id === dateStr)?.count || 0;
      const userCount = usersByDay.find((u) => u._id === dateStr)?.count || 0;

      chartData.push({
        name: monthDayStr,
        orders: orderCount,
        users: userCount,
      });
    }

    return success({
      totalUsers,
      totalSellers,
      totalDelivery,
      totalOrders,
      recentUsers,
      recentOrders,
      chartData,
      socialMetrics
    });
  } catch (err: any) {
    return error(err.message || "Failed to fetch dashboard");
  }
}
