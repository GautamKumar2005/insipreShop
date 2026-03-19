import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import DeliveryProfile from "@/models/DeliveryProfile";
import { success, error } from "@/lib/response";
import { ROLES } from "@/lib/constants";

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const userId = req.headers.get("x-user-id");
    const role = req.headers.get("x-user-role");

    if (role !== ROLES.DELIVERY) return error("Delivery only", 403);

    const { lat, lng } = await req.json();

    const delivery = await DeliveryProfile.findOneAndUpdate(
      { user: userId },
      {
        currentLocation: {
          type: "Point",
          coordinates: [lng, lat],
        },
        isAvailable: true,
      },
      { new: true }
    );

    if (!delivery) return error("Delivery profile not found", 404);

    return success({ message: "Location updated" });
  } catch (err: any) {
    return error(err.message || "Location update failed");
  }
}
