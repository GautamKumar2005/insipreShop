export const runtime = "nodejs";
import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import { comparePassword } from "@/utils/hash";
import { success, error } from "@/lib/response";
import { generateToken } from "@/lib/jwt";
import { getOTP, deleteOTP } from "@/lib/supabase-db";

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const { email, password, otp } = await req.json();

    if (!email || (!password && !otp)) {
      return error("Email and either password or OTP are required", 400);
    }

    // 🔑 Check Master Admin Login First
    if (
      process.env.ADMIN_MAIL &&
      process.env.ADMIN_PASSWORD &&
      email === process.env.ADMIN_MAIL &&
      password === process.env.ADMIN_PASSWORD
    ) {
      // Create a dummy but valid looking token/user for mater admin
      const token = generateToken({
        id: "master-admin-id",
        role: "admin",
      });

      return success({
        token,
        user: {
          id: "master-admin-id",
          name: "System Admin",
          email: process.env.ADMIN_MAIL,
          role: "admin",
        },
      });
    }

    // 🔍 Find user
    const user = await User.findOne({ email });
    if (!user) {
      return error("Invalid email or password", 401);
    }

    // 🔐 Compare password or OTP 
    if (otp) {
      const storedOtp = await getOTP(email);
      
      if (!storedOtp || storedOtp !== otp) {
        return error("Invalid or expired OTP", 401);
      }
      
      // ✅ Clear OTP after successful use automatically
      await deleteOTP(email);
    } else {
      const isMatch = await comparePassword(password, user.password);
      if (!isMatch) {
        return error("Invalid email or password", 401);
      }
    }

    // 🎫 Generate JWT
    const token = generateToken({
      id: user._id.toString(), // ✅ always stringify ObjectId
      role: user.role,
    });

    // ✅ Success response
    return success({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        address: user.address,
      },
    });
  } catch (err: any) {
    console.error("LOGIN ERROR:", err);
    return error("Login failed", 500);
  }
}
