export const runtime = "nodejs";

import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import { success, error } from "@/lib/response";
import { getOTP, deleteOTP } from "@/lib/supabase-db";
import { hashPassword } from "@/utils/hash";

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const { email, otp, newPassword } = await req.json();

    if (!email || !otp || !newPassword) {
      return error("Email, OTP, and new password are required", 400);
    }

    // Verify OTP
    const storedOtp = await getOTP(email);

    if (!storedOtp || storedOtp !== otp) {
      return error("Invalid or expired OTP", 401);
    }

    // Hash the new password
    const hashedPassword = await hashPassword(newPassword);

    // Update the user
    const updatedUser = await User.findOneAndUpdate(
      { email },
      { password: hashedPassword },
      { new: true }
    );

    if (!updatedUser) {
      return error("User not found", 404);
    }

    // Clean up OTP manually after success
    await deleteOTP(email);

    return success({ message: "Password updated successfully" });
  } catch (err: any) {
    console.error("RESET PASSWORD ERROR:", err);
    return error("Failed to reset password", 500);
  }
}
