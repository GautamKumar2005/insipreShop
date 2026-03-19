import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import SellerProfile from "@/models/SellerProfile";
import { success, error } from "@/lib/response";
import { ROLES } from "@/lib/constants";

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const role = req.headers.get("x-user-role");
    if (role !== ROLES.ADMIN) return error("Unauthorized", 403);

    const sellers = await SellerProfile.find().populate("user");
    return success(sellers);
  } catch (err: any) {
    return error(err.message || "Failed to fetch sellers");
  }
}
