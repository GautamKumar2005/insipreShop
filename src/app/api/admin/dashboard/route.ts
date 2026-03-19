import { NextRequest } from "next/server";
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
    });
  } catch (err: any) {
    return error(err.message || "Failed to fetch dashboard");
  }
}
