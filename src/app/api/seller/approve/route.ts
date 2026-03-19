import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import SellerProfile from "@/models/SellerProfile";
import User from "@/models/User";
import { success, error } from "@/lib/response";
import { ROLES } from "@/lib/constants";

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const userId = req.headers.get("x-user-id");
    const role = req.headers.get("x-user-role");

    if (!userId) return error("Unauthorized", 401);

    if (role === ROLES.SELLER)
      return error("Already a seller", 409);

    const { shopName } = await req.json();
    if (!shopName) return error("shopName is required", 400);

    const existing = await SellerProfile.findOne({ user: userId });
    if (existing) return error("Seller profile already exists", 409);

    const seller = await SellerProfile.create({
      user: userId,
      shopName,
      isApproved: true, // ✅ auto approved
    });

    await User.findByIdAndUpdate(userId, {
      role: ROLES.SELLER,
    });

    return success(seller, 201);
  } catch (err: any) {
    return error(err.message || "Seller apply failed");
  }
}
