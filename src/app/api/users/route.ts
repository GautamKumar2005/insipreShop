import { connectDB } from "@/lib/db";
import User from "@/models/User";
import { success, error } from "@/lib/response";

/*
  GET /api/users
  👉 Admin: get all users
*/
export async function GET() {
  try {
    await connectDB();

    const users = await User.find().select("_id name profilePhoto role");
    return success(users);
  } catch (err: any) {
    return error(err.message || "Failed to fetch users");
  }
}
