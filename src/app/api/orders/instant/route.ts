export const runtime = "nodejs";

import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import Product from "@/models/Product";
import Order from "@/models/Order";
import Notification from "@/models/Notification";
import DeliveryTask from "@/models/DeliveryTask";
import User from "@/models/User";
import { success, error } from "@/lib/response";
import { ROLES } from "@/lib/constants";
import { verifyAccessToken } from "@/lib/jwt";

/* =========================
   Auth Helper
========================= */
function getUserFromToken(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) throw new Error("Unauthorized");

  const token = authHeader.split(" ")[1];
  const decoded: any = verifyAccessToken(token);

  if (!decoded?.id || !decoded?.role)
    throw new Error("Invalid or expired token");

  return decoded; // { id, role }
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const user = getUserFromToken(req);
    if (user.role !== ROLES.BUYER)
      return error("Only buyers can place orders", 403);

    const { productId, quantity = 1, deliveryAddress, paymentMethod } =
      await req.json();

    if (!productId || !deliveryAddress || !paymentMethod)
      return error(
        "Missing required fields: productId, deliveryAddress, paymentMethod",
        400
      );

    if (quantity <= 0) return error("Invalid quantity", 400);

    /* ---------------- Product ---------------- */
    const product = await Product.findById(productId);
    if (!product || !product.isActive)
      return error("Product not found or inactive", 404);

    if (product.stock < quantity)
      return error("Insufficient stock", 400);

    /* ---------------- Create Order ---------------- */
    const order = await Order.create({
      buyer: user.id,
      seller: product.seller,
      items: [
        {
          product: product._id,
          quantity,
          price: product.price,
        },
      ],
      totalAmount: product.price * quantity,
      deliveryAddress,
      status: "PLACED",
      paymentStatus: "PENDING",
    });

    /* ---------------- Update Product ---------------- */
    product.stock -= quantity;
    if (product.stock === 0) product.isActive = false;
    await product.save();

    /* ---------------- Delivery Task Creation ---------------- */
    // Fetch seller for pickup location
    const seller = await User.findById(product.seller);

    const deliveryTask = await DeliveryTask.create({
      order: order._id,
      pickupLocation: seller?.address || "Seller address not available",
      dropLocation: deliveryAddress,
      quantity,
      status: "WAITING",
      isAvailable: true,
    });

    /* ---------------- 🔔 Seller Notification ---------------- */
    const notification = await Notification.create({
      user: product.seller,
      orderId: order._id, // link notification to order (if not in schema, it will be ignored but good to have intent)
      title: "New Order! Prepare for Pickup",
      body: `You have received a new order for ${quantity}x ${product.name}. A delivery partner will be arriving soon to pick up the item.`,
      isRead: false,
      deliveryTask: deliveryTask._id, // Link to delivery task
    });

    return success({ order, notification }, 201);
  } catch (err: any) {
    return error(err.message || "Instant order creation failed");
  }
}
