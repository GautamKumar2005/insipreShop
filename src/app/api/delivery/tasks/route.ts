export const runtime = "nodejs";
import "@/models/Product";
import Order from "@/models/Order";
import User from "@/models/User";
import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import DeliveryTask from "@/models/DeliveryTask";
import DeliveryProfile from "@/models/DeliveryProfile";
import { success, error } from "@/lib/response";
import { ROLES } from "@/lib/constants";
import { getAuthUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const user = await getAuthUser(req);
    if (!user || user.role !== ROLES.DELIVERY) {
      return error("Unauthorized: Delivery only", 403);
    }

    // Update activity
    await User.findByIdAndUpdate(user._id, { $set: { isOnline: true, lastSeen: new Date() } });

    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") || "available"; // available | assigned

    const deliveryProfile = await DeliveryProfile.findOne({ user: user.id });
    if (!deliveryProfile) {
      return error("Delivery profile not found", 404);
    }

    let query: any = {};

    if (type === "assigned") {
      // ✅ TASKS ASSIGNED TO ME
      query = {
        delivery: deliveryProfile._id,
      };
    } else {
      // ✅ AVAILABLE TASKS (Default)
      // 🔄 Sync: Create missing tasks for existing orders
      const existingTaskOrderIds = await DeliveryTask.distinct("order");
      const missingOrders = await Order.find({
        _id: { $nin: existingTaskOrderIds },
        status: { $in: ["PLACED", "CONFIRMED", "PROCESSING"] },
      });

      for (const order of missingOrders) {
        // Fetch seller for pickup location
        const seller = await User.findById(order.seller);
        const pickupLocation = seller?.address || "Seller Location";

        // Calculate total quantity
        const quantity = order.items.reduce(
          (acc: number, item: any) => acc + item.quantity,
          0
        );

        await DeliveryTask.create({
          order: order._id,
          pickupLocation,
          dropLocation: order.deliveryAddress,
          quantity,
          status: "WAITING",
          isAvailable: true,
        });
      }

      // Show all Waiting tasks that are not yet assigned
      query = {
        status: "WAITING",
        delivery: null,
      };
    }

    const tasks = await DeliveryTask.find(query)
      .populate({
        path: "order",
        populate: [
          { path: "buyer" },
          { path: "seller" },
          { path: "items.product" },
        ],
      })
      .sort({ createdAt: -1 });

    return success(tasks);
  } catch (err: any) {
    console.error("API Error /delivery/tasks:", err);
    return error(err.message || "Failed to fetch delivery tasks");
  }
}
