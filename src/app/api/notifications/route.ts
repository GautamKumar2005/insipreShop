import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import Notification from "@/models/Notification";
import { success, error } from "@/lib/response";

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const userId = req.headers.get("x-user-id");
    if (!userId) return error("Unauthorized", 406);

    const notifications = await Notification.find({ user: userId }).sort({
      createdAt: -1,
    });

    return success(notifications);
  } catch (err: any) {
    return error(err.message || "Failed to fetch notifications");
  }
}
