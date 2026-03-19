export const runtime = "nodejs";

import "@/models/_init";
import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import Order from "@/models/Order";
import DeliveryTask from "@/models/DeliveryTask";
import DeliveryProfile from "@/models/DeliveryProfile";
import { success, error } from "@/lib/response";
import { ROLES } from "@/lib/constants";
import { verifyAccessToken } from "@/lib/jwt";

function getUserFromToken(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) throw new Error("Unauthorized");
  return verifyAccessToken(authHeader.split(" ")[1]);
}

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const user: any = getUserFromToken(req);
    if (user.role !== ROLES.BUYER) return error("Only buyers can access orders", 403);

    // Get all orders for this buyer
    const orders = await Order.find({ buyer: user.id }).populate("items.product", "name price images");

    const results = [];

    for (const order of orders) {
      // Find delivery task linked to this order
      const task = await DeliveryTask.findOne({ order: order._id }).populate({
        path: "delivery",
        select: "name phone email",
      });

      let deliveryInfo = "Processing your delivery";
      if (task && task.isAccept && !task.isAvailable) {
        deliveryInfo = task.delivery;
      }

      results.push({
        orderId: order._id,
        items: order.items,
        deliveryInfo,
        status: task?.status || "WAITING",
      });
    }

    return success(results);
  } catch (err: any) {
    return error(err.message || "Failed to fetch orders");
  }
}
