export const runtime = "nodejs";
import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import DeletedUser from "@/models/DeletedUser";
import UserActivity from "@/models/UserActivity";
import { success, error } from "@/lib/response";
import { ROLES } from "@/lib/constants";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const role = req.headers.get("x-user-role");
    if (role !== ROLES.ADMIN) return error("Unauthorized", 403);

    const { id } = await context.params;

    const deletedUser = await DeletedUser.findById(id);
    if (!deletedUser) return error("Deleted user record not found", 404);

    const activities = await UserActivity.find({ email: deletedUser.email }).sort({ timestamp: -1 });

    return success(activities);
  } catch (err: any) {
    return error(err.message || "Failed to fetch deleted user activities", 500);
  }
}
