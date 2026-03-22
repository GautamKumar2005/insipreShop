export const runtime = "nodejs";

import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import { success, error } from "@/lib/response";
import { hashPassword, comparePassword } from "@/utils/hash";
import { jwtVerify } from "jose";

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return error("Authentication required", 401);
    }

    const token = authHeader.split(" ")[1];
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || "default_secret");
    const { payload } = await jwtVerify(token, secret);
    const userId = payload.id as string;

    const { oldPassword, newPassword } = await req.json();

    if (!oldPassword || !newPassword) {
      return error("Old password and new password are required", 400);
    }

    const user = await User.findById(userId);
    if (!user) {
      return error("User not found", 404);
    }

    // Verify old password
    const isMatch = await comparePassword(oldPassword, user.password);
    if (!isMatch) {
      return error("Incorrect old password", 400);
    }

    // Hash and update new password
    const hashedPassword = await hashPassword(newPassword);
    user.password = hashedPassword;
    await user.save();

    return success({ message: "Password updated successfully" });
  } catch (err: any) {
    console.error("Change password error:", err);
    return error("Failed to change password", 500);
  }
}
