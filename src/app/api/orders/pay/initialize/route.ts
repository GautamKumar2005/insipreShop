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

    const { orderId } = await req.json();

    if (!orderId) {
      return error("orderId is required", 400);
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
      return error("Unauthorized", 403);
    }

    if (order.paymentStatus === "PAID") {
      return error("Order has already been paid", 400);
    }

    // Deactivate previous active sessions for this order
    await pool.query(
      "UPDATE payment_sessions SET status = 'expired' WHERE order_id = $1 AND status = 'active'",
      [orderId]
    );

    // Insert new 10-minute payment session
    const res = await pool.query(
      "INSERT INTO payment_sessions (order_id, expires_at) VALUES ($1, NOW() + INTERVAL '10 minutes') RETURNING id, expires_at",
      [orderId]
    );

    const session = res.rows[0];

    return success({
      sessionId: session.id,
      expiresAt: session.expires_at,
    });

  } catch (err: any) {
    return error(err.message || "Failed to initialize payment session", 500);
  }
}
