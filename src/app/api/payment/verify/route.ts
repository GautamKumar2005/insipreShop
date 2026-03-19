import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import Order from "@/models/Order";
import { success, error } from "@/lib/response";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
      await req.json();

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature)
      return error("All fields are required", 400);

    const order = await Order.findOne({ razorpayOrderId: razorpay_order_id });
    if (!order) return error("Order not found", 404);

    // Verify signature
    const generated_signature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (generated_signature !== razorpay_signature)
      return error("Payment verification failed", 400);

    // Payment successful
    order.paymentStatus = "PAID";
    order.status = "PROCESSING";
    order.razorpayPaymentId = razorpay_payment_id;
    await order.save();

    return success(order);
  } catch (err: any) {
    return error(err.message || "Payment verification failed");
  }
}
