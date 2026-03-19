import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import ChatRoom from "@/models/ChatRoom";
import { success, error } from "@/lib/response";
import { verifyAccessToken } from "@/lib/jwt";

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    let userId = req.headers.get("x-user-id");
    
    // Fallback: Verify token if header missing
    if (!userId) {
        const authHeader = req.headers.get("authorization");
        if (authHeader?.startsWith("Bearer ")) {
            const token = authHeader.split(" ")[1];
            const decoded: any = verifyAccessToken(token);
            if (decoded?.id) {
                userId = decoded.id;
            }
        }
    }

    if (!userId) return error("Unauthorized", 401);

    const { participantId, orderId } = await req.json();
    if (!participantId) return error("Participant required", 400);

    // Check if room already exists between these two users
    let room = await ChatRoom.findOne({
      participants: { $all: [userId, participantId] },
      order: orderId // Scope chat to specific order
    });

    if (!room) {
      room = await ChatRoom.create({
        participants: [userId, participantId],
        order: orderId, // Link to order
      });
    }

    return success(room, "Chat room created");
  } catch (err: any) {
    return error(err.message || "Failed to create chat room", 500);
  }
}

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const userId = req.headers.get("x-user-id");
    if (!userId) return error("Unauthorized", 401);

    const rooms = await ChatRoom.find({
      participants: userId,
    }).populate("participants", "name email");

    return success(rooms);
  } catch (err: any) {
    return error(err.message || "Failed to fetch chat rooms");
  }
}
