import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import DeliveryProfile from "@/models/DeliveryProfile";
import { success, error } from "@/lib/response";

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const userId = req.headers.get("x-user-id");
    if (!userId) return error("Unauthorized", 401);

    const body = await req.json();

    const existing = await DeliveryProfile.findOne({ user: userId });
    if (existing) return error("Delivery profile already exists", 409);

    const delivery = await DeliveryProfile.create({
      user: userId,
      phone: body.phone,
      vehicleType: body.vehicleType,
      isApproved: false,
      isAvailable: false,
    });

    return success(delivery, 201);
  } catch (err: any) {
    return error(err.message || "Delivery apply failed");
  }
}
