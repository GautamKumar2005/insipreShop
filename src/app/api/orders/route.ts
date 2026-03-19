export const runtime = "nodejs";

import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import Product from "@/models/Product";
import User from "@/models/User";
import Order from "@/models/Order";
import DeliveryProfile from "@/models/DeliveryProfile";
import Notification from "@/models/Notification";
import { success, error } from "@/lib/response";
import { ROLES } from "@/lib/constants";
import { verifyAccessToken } from "@/lib/jwt";

/* =========================
   Auth Helper
========================= */
function getUser(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) throw new Error("Unauthorized");
  const decoded = verifyAccessToken(auth.split(" ")[1]);
  if (!decoded || typeof decoded === "string") throw new Error("Invalid Token");
  return decoded as any; 
}

/* =========================
   GET /api/orders
========================= */
export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const user = getUser(req);

    const _p = Product.modelName;
    const _u = User.modelName;

    let query: any = {};

    if (user.role === ROLES.SELLER) {
      query.seller = user.id;
    } else if (user.role === ROLES.BUYER) {
      query.buyer = user.id;
    } else if (user.role === ROLES.DELIVERY) {
      query.delivery = user.id;
    }

    const orders = await Order.find(query)
      .populate({
        path: "items.product",
        select: "name images price",
      })
      .populate("seller", "name")
      .sort({ createdAt: -1 });

    return success(orders);
  } catch (err: any) {
    return error(err.message || "Failed to fetch orders");
  }
}

/* =========================
   PATCH /api/orders/status
========================= */
export async function PATCH(req: NextRequest) {
  try {
    await connectDB();

    const user = getUser(req);
    const { orderId, status } = await req.json();

    if (!orderId || !status)
      return error("orderId and status required", 400);

    const order = await Order.findById(orderId);
    if (!order) return error("Order not found", 404);

    /* ---------------- Seller confirms ---------------- */
    if (user.role === ROLES.SELLER) {
      if (order.seller.toString() !== user.id)
        return error("Unauthorized", 403);

      if (status !== "CONFIRMED")
        return error("Seller can only CONFIRM order", 400);

      order.status = "CONFIRMED";

      // notify buyer
      await Notification.create({
        user: order.buyer,
        title: "Order Confirmed",
        body: `Your order ${order._id} has been confirmed by seller`,
      });
    }

    /* ---------------- Delivery updates ---------------- */
    else if (user.role === ROLES.DELIVERY) {
      if (order.delivery?.toString() !== user.id)
        return error("Unauthorized", 403);

      if (!["PICKED_UP", "DELIVERED"].includes(status))
        return error("Invalid delivery status", 400);

      order.status = status;

      // free delivery after completion
      if (status === "DELIVERED" || status === "COMPLETED") {
        order.paymentStatus = "PAID";
        await DeliveryProfile.findOneAndUpdate(
          { user: user.id },
          { isAvailable: true }
        );
      }
    }

    else {
      return error("Unauthorized", 403);
    }

    await order.save();
    return success(order);
  } catch (err: any) {
    return error(err.message || "Failed to update order status");
  }
}
