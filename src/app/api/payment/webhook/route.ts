import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import Order from "@/models/Order";
import { success, error } from "@/lib/response";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const webhookBody = await req.text(); // raw body required
    const signature = req.headers.get("x-razorpay-signature");

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
      .update(webhookBody)
      .digest("hex");

    if (signature !== expectedSignature) return error("Invalid signature", 400);

    const event = JSON.parse(webhookBody);

    if (event.event === "payment.captured") {
      const { order_id, payment_id } = event.payload.payment.entity;

      const order = await Order.findOne({ razorpayOrderId: order_id });
      if (order) {
        order.paymentStatus = "PAID";
        order.status = "PROCESSING";
        order.razorpayPaymentId = payment_id;
        await order.save();
      }
    }

    return success({ message: "Webhook processed" });
  } catch (err: any) {
    return error(err.message || "Webhook failed");
  }
}
