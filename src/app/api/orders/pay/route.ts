export const runtime = "nodejs";

import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { pool } from "@/lib/supabase-db";
import mongoose from "mongoose";
import Order from "@/models/Order";
import { success, error } from "@/lib/response";
import { verifyAccessToken } from "@/lib/jwt";

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    let userId = req.headers.get("x-user-id");
    let role = req.headers.get("x-user-role");

    // Fallback manual token verification if headers aren't populated
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

    if (!userId) {
      return error("Unauthorized", 401);
    }

    const { orderId, amount, paymentMethod, transactionId } = await req.json();

    if (!orderId || !amount || !paymentMethod || !transactionId) {
      return error("Missing required payment fields", 400);
    }

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return error("Invalid Order ID format", 400);
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return error("Order not found", 404);
    }

    // Verify buyer is the owner of the order
    if (order.buyer.toString() !== userId) {
      return error("You are not authorized to pay for this order", 403);
    }

    if (order.paymentStatus === "PAID") {
      return error("Order has already been paid", 400);
    }

    // Verify active unexpired session exists
    const sessionRes = await pool.query(
      "SELECT * FROM payment_sessions WHERE order_id = $1 AND status = 'active' AND expires_at > NOW() ORDER BY started_at DESC LIMIT 1",
      [orderId]
    );

    if (sessionRes.rows.length === 0) {
      return error("No active payment session found or payment session has expired. Please go back and click 'Make Payment' to start a new 10-minute session.", 400);
    }

    const session = sessionRes.rows[0];

    // 1. Write payment transaction record to Supabase Postgresql
    await pool.query(
      "INSERT INTO order_payments (order_id, amount, payment_method, transaction_id, status) VALUES ($1, $2, $3, $4, $5)",
      [orderId, amount, paymentMethod, transactionId, "success"]
    );

    // 2. Mark payment session as completed
    await pool.query(
      "UPDATE payment_sessions SET status = 'completed' WHERE id = $1",
      [session.id]
    );

    // 3. Update order status in MongoDB
    order.paymentStatus = "PAID";
    if (order.status === "PLACED") {
      order.status = "CONFIRMED";
    }
    await order.save();

    return success({
      orderId: order._id,
      paymentStatus: order.paymentStatus,
      status: order.status
    });

  } catch (err: any) {
    return error(err.message || "Failed to process order payment", 500);
  }
}
