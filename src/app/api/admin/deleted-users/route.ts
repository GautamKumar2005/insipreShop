export const runtime = "nodejs";
import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import DeletedUser from "@/models/DeletedUser";
import { success, error } from "@/lib/response";
import { ROLES } from "@/lib/constants";

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const role = req.headers.get("x-user-role");
    if (role !== ROLES.ADMIN) return error("Unauthorized", 403);

    const deletedUsers = await DeletedUser.find().sort({ deletedAt: -1 });
    return success(deletedUsers);
  } catch (err: any) {
    return error(err.message || "Failed to fetch deleted users", 500);
  }
}
