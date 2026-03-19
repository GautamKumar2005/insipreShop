import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import DeliveryTask from "@/models/DeliveryTask";
import DeliveryProfile from "@/models/DeliveryProfile";
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
    
    // Use user.id instead of header
    const userId = user.id;

    const { taskId } = await req.json();
    if (!taskId) return error("taskId required", 400);

    const deliveryProfile = await DeliveryProfile.findOne({ user: userId });
    if (!deliveryProfile) return error("Delivery profile not found", 404);

    // ✅ Accept the task
    const task = await DeliveryTask.findOneAndUpdate(
      {
        _id: taskId,
        isAvailable: true,
        isAccept: false,
        isDelivered: false,
      },
      {
        isAccept: true,
        isAvailable: false,
        delivery: deliveryProfile._id,
        status: "ASSIGNED",
      },
      { new: true }
    );

    if (!task) return error("Task not available or already accepted", 409);

    // ✅ Update Order to link delivery person
    // We link the User ID of the delivery person to the order
    const dbOrder = await import("@/models/Order").then((mod) =>
      mod.default.findByIdAndUpdate(task.order, {
        delivery: userId, 
        // Optional: you might want to ensure status is at least confirmed/assigned
      })
    );

    if (dbOrder) {
        // Find seller to notify
        await import("@/models/Notification").then((mod) => 
            mod.default.create({
                user: dbOrder.seller,
                title: "Delivery Partner Assigned!",
                body: `A delivery partner has accepted your order ${dbOrder._id}. You can now chat with them to coordinate the pickup.`,
                orderId: dbOrder._id
            })
        );
        
        // Auto-create chat room between Seller and Delivery Boy
        await import("@/models/ChatRoom").then((mod) => 
            mod.default.findOneAndUpdate(
                {
                    participants: { $all: [dbOrder.seller, userId] },
                    order: dbOrder._id
                },
                {
                    $setOnInsert: {
                        participants: [dbOrder.seller, userId],
                        order: dbOrder._id
                    }
                },
                { upsert: true, new: true }
            )
        );
    }

    return success({
      message: "Task accepted successfully",
      task,
    });
  } catch (err: any) {
    return error(err.message || "Failed to accept task");
  }
}
