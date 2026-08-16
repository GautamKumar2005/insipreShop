export const runtime = "nodejs";
import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import DeletedUser from "@/models/DeletedUser";
import { success, error } from "@/lib/response";
import { ROLES } from "@/lib/constants";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const role = req.headers.get("x-user-role");
    if (role !== ROLES.ADMIN) return error("Unauthorized", 403);

    const { id } = await context.params;

    const deletedUser = await DeletedUser.findById(id);
    if (!deletedUser) return error("Deleted user profile not found", 404);

    const profile = deletedUser.archivedData.profile;

    // Check if user already exists
    const existingUser = await User.findOne({ email: profile.email });
    if (existingUser) {
      return error("An active account with this email already exists", 400);
    }

    // Recreate user
    await User.create(profile);

    // Delete deleted user archive record
    await DeletedUser.findByIdAndDelete(id);

    return success({ message: "User account recovered/rolled back successfully." });
  } catch (err: any) {
    return error(err.message || "Failed to recover user account", 500);
  }
}
