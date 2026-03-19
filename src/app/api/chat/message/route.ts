import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import Message from "@/models/Message";
import ChatRoom from "@/models/ChatRoom";
import NotificationModel from "@/models/Notification"; // Using NotificationModel as alias
import { success, error } from "@/lib/response";
import User from "@/models/User";
import { verifyAccessToken } from "@/lib/jwt";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { roomId, text } = await req.json();
    if (!roomId) return error("roomId required", 400);

    let userId = req.headers.get("x-user-id");
    if (!userId) {
        const authHeader = req.headers.get("authorization");
        if (authHeader?.startsWith("Bearer ")) {
            const token = authHeader.split(" ")[1];
            const decoded: any = verifyAccessToken(token);
            if (decoded?.id) userId = decoded.id;
        }
    }

    if (!userId) return error("Unauthorized", 401);

    await connectDB();
    
    // Update activity on message send
    await User.findByIdAndUpdate(userId, { $set: { isOnline: true, lastSeen: new Date() } });

    const room = await ChatRoom.findById(roomId);
    if (!room) return error("ChatRoom not found", 404);

    // Create message (Use 'message' key to match schema)
    const msg = await Message.create({
      chatRoom: roomId,
      sender: userId,
      message: text,
      isRead: false,
    });

    // Populate sender immediately so frontend can display name
    await msg.populate("sender", "name email");

    // Notification Logic
    const recipientId = room.participants.find(
      (p: any) => p.toString() !== userId
    );

    if (recipientId) {
      await NotificationModel.create({
        user: recipientId,
        title: "New Message",
        body: `You have a new message: ${text.substring(0, 30)}...`,
        isRead: false,
        deliveryTask: room.order ? undefined : undefined, // Optional link
      });
    }

    return success(msg);
  } catch (err: any) {
        return error(err.message || "Failed to send message");
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const roomId = searchParams.get("roomId");

    if (!roomId) return error("roomId required", 400);

    let userId = req.headers.get("x-user-id");
    if (!userId) {
        const authHeader = req.headers.get("authorization");
        if (authHeader?.startsWith("Bearer ")) {
            const token = authHeader.split(" ")[1];
            const decoded: any = verifyAccessToken(token);
            if (decoded?.id) userId = decoded.id;
        }
    }

    if (!userId) return error("Unauthorized", 401);

    await connectDB();

    // Verify access
    const room = await ChatRoom.findById(roomId);
    if (!room) return error("Room not found", 404);

    const participants = room.participants.map((p: any) => p.toString());
    if (!participants.includes(userId)) return error("Unauthorized", 403);

    // Update last seen for current user
    await User.findByIdAndUpdate(userId, { $set: { isOnline: true, lastSeen: new Date() } });

    // Mark as Read
    await Message.updateMany(
      { chatRoom: roomId, sender: { $ne: userId }, isRead: false },
      { $set: { isRead: true } }
    );

    // Fetch messages
    const messages = await Message.find({ chatRoom: roomId })
      .populate("sender", "name email isOnline lastSeen")
      .sort({ createdAt: 1 });

    // Fetch room to get partner details explicitly (ensure fresh status even if no messages)
    const roomDetails = await ChatRoom.findById(roomId).populate("participants", "name email isOnline lastSeen");
    const partner = roomDetails ? roomDetails.participants.find((p: any) => p._id.toString() !== userId) : null;

    return success({ messages, partner });
  } catch (err: any) {
        return error(err.message || "Failed to fetch messages");
  }
}
