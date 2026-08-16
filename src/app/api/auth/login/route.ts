export const runtime = "nodejs";
import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import UserActivity from "@/models/UserActivity";
import { comparePassword } from "@/utils/hash";
import { success, error } from "@/lib/response";
import { generateToken } from "@/lib/jwt";
import { getOTP, deleteOTP, hashOTP } from "@/lib/supabase-db";

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

      // Log master admin login
      try {
        const ip = req.headers.get("x-forwarded-for") || (req as any).ip || "127.0.0.1";
        const userAgent = req.headers.get("user-agent") || "unknown";
        await UserActivity.create({
          userId: "master-admin-id",
          email: process.env.ADMIN_MAIL,
          name: "System Admin",
          role: "admin",
          type: "login",
          ip,
          userAgent,
          timestamp: new Date(),
          details: "Master Admin logged in successfully"
        });
      } catch (activityErr) {
        console.error("Master Admin activity logging error:", activityErr);
      }

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
      
      if (!storedOtp || storedOtp !== hashOTP(otp)) {
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

    // Log standard user login
    try {
      const ip = req.headers.get("x-forwarded-for") || (req as any).ip || "127.0.0.1";
      const userAgent = req.headers.get("user-agent") || "unknown";
      await UserActivity.create({
        userId: user._id.toString(),
        email: user.email,
        name: user.name,
        role: user.role,
        type: "login",
        ip,
        userAgent,
        timestamp: new Date(),
        details: "User logged in successfully"
      });
    } catch (activityErr) {
      console.error("User activity logging error:", activityErr);
    }

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
        return error("Login failed", 500);
  }
}
