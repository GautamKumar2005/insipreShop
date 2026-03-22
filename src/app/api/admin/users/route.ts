import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import { success, error } from "@/lib/response";
import { ROLES } from "@/lib/constants";

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const role = req.headers.get("x-user-role");
    if (role !== ROLES.ADMIN) return error("Unauthorized", 403);

    const search = req.nextUrl.searchParams.get("search") || "";
    let query: any = {};

    if (search) {
      query = {
        $or: [
          { name: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
          { phone: { $regex: search, $options: "i" } },
        ],
      };
    }

    const users = await User.find(query).sort({ createdAt: -1 });
    return success(users);
  } catch (err: any) {
    return error(err.message || "Failed to fetch users");
  }
}
