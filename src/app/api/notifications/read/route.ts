export const runtime = "nodejs";
import "@/models/Product";   // 🔥 REQUIRED
import "@/models/Order";     // 🔥 REQUIRED
import "@/models/User";
import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import Product from "@/models/Product";
import Notification from "@/models/Notification";
import DeliveryTask from "@/models/DeliveryTask";
import Order from "@/models/Order";
import User from "@/models/User";
import { success, error } from "@/lib/response";

function extractQuantity(body: string): number {
  const match = body.match(/Quantity:\s*(\d+)/i);
  return match ? Number(match[1]) : 1;
}
export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const sellerId = req.headers.get("x-user-id");
    if (!sellerId) return error("Unauthorized", 401);

    const { notificationId } = await req.json();
    if (!notificationId) return error("notificationId required", 400);

    // 🔔 Get notification
    const notification = await Notification.findOne({
      _id: notificationId,
      user: sellerId,
    });
    if (!notification) return error("Notification not found", 404);

    // 🧾 Extract orderId and quantity
    const orderIdMatch = notification.body.match(/Order ID:\s*([a-f0-9]{24})/i);
    if (!orderIdMatch) return error("Order ID not found", 400);
    const orderId = orderIdMatch[1];

    const quantity = extractQuantity(notification.body);

    // 📦 Get order info
    const order = await Order.findById(orderId)
      .populate("buyer")
      .populate("seller")
      .populate("items.product");
    if (!order) return error("Order not found", 404);

    // 📍 Pickup & Drop Locations
    const pickupLocation = (order.seller as any).address;
    const dropLocation = order.deliveryAddress;

    // 🚚 Check for existing Delivery Task
    let deliveryTask = await DeliveryTask.findOne({ order: order._id });

    if (!deliveryTask) {
      deliveryTask = await DeliveryTask.create({
        order: order._id,
        pickupLocation,
        dropLocation,
        quantity,
        status: "WAITING",
        isAccept: false,
        isAvailable: true,
        isDelivered: false,
      });
    }

    // 🔄 Update notification
    notification.isRead = true;
    notification.deliveryTask = deliveryTask._id;
    // Update body to tell seller what to do
    notification.title = "Order Ready for Pickup?"; // Update title
    notification.body = `Order ${order._id} confirmed. Please pack ${quantity} items. Delivery will arrive soon.`; // Update body
    await notification.save();

    return success({
      message: "Notification updated and task linked",
      deliveryTask,
    });
  } catch (err: any) {
    return error(err.message || "Failed to create delivery task");
  }
}
