export const runtime = "nodejs";

import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import mongoose from "mongoose";

// Import models to ensure registration
import User from "@/models/User";
import Product from "@/models/Product";
import Order from "@/models/Order";
import DeliveryTask from "@/models/DeliveryTask";
import DeliveryProfile from "@/models/DeliveryProfile";

import { success, error } from "@/lib/response";
import { ROLES } from "@/lib/constants";
import { verifyAccessToken } from "@/lib/jwt";

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: Params) {
  try {
    await connectDB();
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return error("Invalid Order ID", 400);
    }

    let userId = req.headers.get("x-user-id");
    let role = req.headers.get("x-user-role");

    // Fallback: Verify token manually if middleware didn't set headers
    if (!userId || !role) {
      const authHeader = req.headers.get("authorization");
      if (authHeader?.startsWith("Bearer ")) {
        const token = authHeader.split(" ")[1];
        const decoded: any = verifyAccessToken(token);
        if (decoded?.id && decoded?.role) {
          userId = decoded.id;
          role = decoded.role;
        }
      }
    }

    if (!userId || !role) return error("Unauthorized", 401);

    // Update activity
    await User.findByIdAndUpdate(userId, { $set: { isOnline: true, lastSeen: new Date() } });

    // Ensure models are "touched" to prevent MissingSchemaError during population
    const _p = Product.modelName;
    const _u = User.modelName;
    const _dp = DeliveryProfile.modelName;

    const order = await Order.findById(id)
      .populate("items.product")
      .populate("buyer")
      .populate("seller");

    if (!order) return error("Order not found", 404);

    if (role === ROLES.BUYER) {
      const buyerId = order.buyer?._id?.toString() || order.buyer?.toString();
      if (buyerId !== userId) return error("Unauthorized", 403);
    }

    if (role === ROLES.SELLER) {
      const sellerId = order.seller?._id?.toString() || order.seller?.toString();
      if (sellerId !== userId) return error("Unauthorized", 403);
    }

    // Include Delivery Status
    const deliveryTask = await DeliveryTask.findOne({
      order: order._id,
    })
      .populate({
        path: "delivery",
        populate: {
          path: "user",
          select: "name phone profilePhoto email",
        },
      });

    return success({
      ...order.toObject(),
      deliveryStatus: deliveryTask?.status || "WAITING",
      deliveryTask: deliveryTask
        ? {
            ...deliveryTask.toObject(),
            deliveryPerson: deliveryTask.delivery
              ? (deliveryTask.delivery as any).user
              : null,
          }
        : null,
    });
  } catch (err: any) {
    console.error("Error in GET /api/orders/[id]:", err);
    return error(err.message || "Failed to fetch order", 400); // Keep 400 but with real message
  }
}
