import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import Feedback from "@/models/Feedback";
import { success, error } from "@/lib/response";
import { ROLES } from "@/lib/constants";

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const role = req.headers.get("x-user-role");
    if (role !== ROLES.ADMIN) return error("Unauthorized", 403);

    const feedbacks = await Feedback.find().sort({ createdAt: -1 });
    return success(feedbacks);
  } catch (err: any) {
    return error(err.message || "Failed to fetch feedback");
  }
}

export async function PATCH(req: NextRequest) {
  try {
    await connectDB();

    const role = req.headers.get("x-user-role");
    if (role !== ROLES.ADMIN) return error("Unauthorized", 403);

    const { id, status } = await req.json();

    if (!id || !status) return error("Missing fields", 400);

    const updated = await Feedback.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (!updated) return error("Feedback not found", 404);

    return success(updated);
  } catch (err: any) {
    return error(err.message || "Failed to process feedback");
  }
}
