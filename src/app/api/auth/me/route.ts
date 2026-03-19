export const runtime = "nodejs";

import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import { verifyAccessToken } from "@/lib/jwt";
import { success, error } from "@/lib/response";

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return error("Unauthorized", 401);
    }

    const token = authHeader.split(" ")[1];
    const decoded: any = verifyAccessToken(token);

    if (!decoded || !decoded.id) {
      return error("Invalid token", 401);
    }

    if (decoded.id === "master-admin-id") {
      return success({
        user: {
          id: "master-admin-id",
          name: "System Admin",
          email: process.env.ADMIN_MAIL || "admin@admin.com",
          role: "admin",
        }
      });
    }

    const user = await User.findById(decoded.id).select("-password");
    
    if (!user) {
      return error("User not found", 404);
    }
    
    // Update activity status
    await User.findByIdAndUpdate(user._id, { $set: { isOnline: true, lastSeen: new Date() } });

    return success({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        address: user.address,
        profilePhoto: user.profilePhoto,
      }
    });

  } catch (err: any) {
    console.error("API Error /auth/me:", err);
    return error(err.message || "Failed to fetch user");
  }
}

export async function PUT(req: NextRequest) {
  try {
    await connectDB();

    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return error("Unauthorized", 401);
    }

    const token = authHeader.split(" ")[1];
    const decoded: any = verifyAccessToken(token);

    if (!decoded || !decoded.id) {
      return error("Invalid token", 401);
    }

    const body = await req.json();
    const { name, phone, address, dob } = body;

    const user = await User.findById(decoded.id);
    if (!user) return error("User not found", 404);

    if (name) user.name = name;
    if (phone) user.phone = phone;
    if (address) user.address = address;
    if (dob) user.dob = new Date(dob);

    await user.save();

    return success({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        address: user.address,
        profilePhoto: user.profilePhoto, // Assuming schema has it
        dob: user.dob,
      }
    });

  } catch (err: any) {
    return error(err.message || "Failed to update profile");
  }
}
