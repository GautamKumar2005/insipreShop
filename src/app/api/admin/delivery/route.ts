import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import DeliveryProfile from "@/models/DeliveryProfile";
import { success, error } from "@/lib/response";
import { ROLES } from "@/lib/constants";

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const role = req.headers.get("x-user-role");
    if (role !== ROLES.ADMIN) return error("Unauthorized", 403);

    const deliveryUsers = await DeliveryProfile.find().populate("user");
    return success(deliveryUsers);
  } catch (err: any) {
    return error(err.message || "Failed to fetch delivery personnel");
  }
}
