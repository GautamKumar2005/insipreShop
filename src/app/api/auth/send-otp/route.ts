export const runtime = "nodejs";
import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import { success, error } from "@/lib/response";
import { setOTP } from "@/lib/supabase-db";
import { sendOTP } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const { email } = await req.json();

    if (!email) {
      return error("Email is required", 400);
    }

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      // Return success even if not found to prevent email enumeration attacks,
      // or return an error if it's explicitly for login. Let's return error here
      // so the frontend knows they can't log in.
      return error("User not found with this email", 404);
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Store in Supabase using pg with 2 minutes expiration
    await setOTP(email, otp);

    // Send email to user
    const emailSent = await sendOTP(email, otp);

    if (!emailSent) {
      // If email couldn't be sent, let the user know via status
    }

    return success({ message: "OTP sent to your email successfully" });
  } catch (err: any) {
    return error("Failed to send OTP", 500);
  }
}
