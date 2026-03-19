import mongoose from "mongoose";
import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import DeliveryTask from "@/models/DeliveryTask";
import DeliveryProfile from "@/models/DeliveryProfile";
import Order from "@/models/Order";
import { success, error } from "@/lib/response";
import { ROLES } from "@/lib/constants";
import { getAuthUser } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const user = await getAuthUser(req);
    if (!user || user.role !== ROLES.DELIVERY) {
      return error("Unauthorized: Delivery only", 403);
    }

    const { taskId, status } = await req.json(); // status: "PICKED" | "DELIVERED"

    if (!taskId || !status) {
      return error("taskId and status required", 400);
    }

    const deliveryProfile = await DeliveryProfile.findOne({ user: user.id });
    if (!deliveryProfile) {
      return error("Delivery profile not found", 404);
    }

    const task = await DeliveryTask.findOne({
      _id: taskId,
      delivery: deliveryProfile._id,
    });

    if (!task) {
      return error("Task not found or not assigned to you", 404);
    }

    // Ensure Order model is loaded
    await import("@/models/Order");
    const OrderModel = mongoose.model("Order");

    // Handle case where task.order is populated or is an ID
    const orderId = (task.order && (task.order as any)._id) ? (task.order as any)._id : task.order;

    const order = await OrderModel.findById(orderId);
    
    if (!order) {
      // ✅ Handle Orphan Task: Delete it if order is missing
      await DeliveryTask.deleteOne({ _id: taskId });
      return success({ 
        message: "Task removed because associated order no longer exists", 
        removed: true 
      });
    }

    if (status === "PICKED") {
      // Update Task Status
      task.status = "IN_TRANSIT";
      
      // Update associated Order Status
      order.status = "PICKED_UP";
      
    } else if (status === "DELIVERED") {
      // Update Task
      task.status = "COMPLETED";
      task.isDelivered = true;

      // Update Order
      order.status = "DELIVERED";
      order.paymentStatus = "PAID"; // Assuming Cash on Delivery is completed upon delivery handover.
      
      // Make delivery person available again for new tasks
       await DeliveryProfile.findByIdAndUpdate(deliveryProfile._id, {
        isAvailable: true
      });
    } else {
      return error("Invalid status action", 400);
    }

    await task.save();
    await order.save();

    return success({ task, order });
  } catch (err: any) {
    return error(err.message || "Failed to update status");
  }
}
