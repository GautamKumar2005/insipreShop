import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import Order from "@/models/Order";
import { success, error } from "@/lib/response";
import Razorpay from "razorpay";

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const userId = req.headers.get("x-user-id");
    if (!userId) return error("Unauthorized", 401);

    const { orderId } = await req.json();

    if (!orderId) return error("Order ID required", 400);

    const order = await Order.findById(orderId);
    if (!order) return error("Order not found", 404);

    // Initialize Razorpay
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID!,
      key_secret: process.env.RAZORPAY_KEY_SECRET!,
    });

    const options = {
      amount: order.totalAmount * 100, // in paise
      currency: "INR",
      receipt: `order_${order._id}`,
      payment_capture: 1,
    };

    const razorpayOrder = await razorpay.orders.create(options);

    // Save razorpay order id to order
    order.razorpayOrderId = razorpayOrder.id;
    await order.save();

    return success({ order: razorpayOrder });
  } catch (err: any) {
    return error(err.message || "Payment creation failed");
  }
}
