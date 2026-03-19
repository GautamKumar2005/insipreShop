export const runtime = "nodejs";

import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import SellerProfile from "@/models/SellerProfile";
import User from "@/models/User";
import { success, error } from "@/lib/response";
import { verifyAccessToken } from "@/lib/jwt";
import { ROLES } from "@/lib/constants";

/* =========================
   Auth helper
========================= */
function getUserFromToken(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) throw new Error("Unauthorized");

  const token = authHeader.split(" ")[1];
  const decoded: any = verifyAccessToken(token);

  if (!decoded?.id) throw new Error("Invalid token");
  return decoded; // { id, role }
}

/* =========================
   POST /api/seller/apply
========================= */
export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const user = getUserFromToken(req);

    // ❌ Already seller
    if (user.role === ROLES.SELLER) {
      return error("Already a seller", 409);
    }

    const { shopName, address, phone } = await req.json();

    if (!shopName || !address || !phone) {
      return error("shopName, address, phone are required", 400);
    }

    // ❌ Already applied
    const existing = await SellerProfile.findOne({ user: user.id });
    if (existing) {
      return error("Seller application already submitted", 409);
    }

    const seller = await SellerProfile.create({
      user: user.id,
      shopName,
      address,
      phone,
      isApproved: false, // ✅ CORRECT
    });

    return success(
      {
        message: "Seller application submitted, awaiting approval",
        seller,
      },
      201
    );
  } catch (err: any) {
    return error(err.message || "Seller apply failed");
  }
}
