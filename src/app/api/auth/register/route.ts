import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import { hashPassword } from "@/utils/hash";
import { success, error } from "@/lib/response";
import { generateToken } from "@/lib/jwt";

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const body = await req.json();

    const {
      name,
      email,
      phone,
      password,
      role,
      profilePhoto,
      dob,
      address,
    } = body;

    // ✅ Proper validation
    if (!name || !email || !phone || !password || !role) {
      return error("All fields are required", 400);
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return error("User already exists", 409);
    }

    const hashedPassword = await hashPassword(password);

    const user = await User.create({
      name,
      email,
      phone,
      password: hashedPassword,
      role,
      profilePhoto,
      dob,
      address,
    });

    // Generate Token
    const token = generateToken({
       id: user._id.toString(),
       role: user.role,
    });

    return success({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        address: user.address,
      }
    });
  } catch (err: any) {
    return error(err.message || "Registration failed");
  }
}
