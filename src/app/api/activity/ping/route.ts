export const runtime = "nodejs";
import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import UserActivity from "@/models/UserActivity";
import { success, error } from "@/lib/response";
import { verifyAccessToken } from "@/lib/jwt";

const authenticate = (req: NextRequest) => {
  const authHeader = req.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;
  const token = authHeader.split(" ")[1];
  try {
    return verifyAccessToken(token) as any;
  } catch (e) {
    return null;
  }
};

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const decoded = authenticate(req);
    if (!decoded || !decoded.id) return error("Unauthorized", 401);

    const body = await req.json();
    const { path, duration = 30 } = body;

    let userDetails = {
      id: decoded.id,
      name: "System Admin",
      email: process.env.ADMIN_MAIL || "admin@insipreshop.com",
      role: "admin"
    };

    if (decoded.id !== "master-admin-id") {
      const dbUser = await User.findById(decoded.id);
      if (!dbUser) return error("User not found", 404);
      userDetails = {
        id: dbUser._id.toString(),
        name: dbUser.name,
        email: dbUser.email,
        role: dbUser.role
      };
    }

    const ip = req.headers.get("x-forwarded-for") || (req as any).ip || "127.0.0.1";
    const userAgent = req.headers.get("user-agent") || "unknown";

    const activity = await UserActivity.create({
      userId: userDetails.id,
      email: userDetails.email,
      name: userDetails.name,
      role: userDetails.role,
      type: "ping",
      ip,
      userAgent,
      path: path || "/",
      duration: Number(duration),
      timestamp: new Date(),
      details: `Active on ${path || "/"}`
    });

    return success(activity);
  } catch (err: any) {
    return error(err.message || "Failed to log activity", 500);
  }
}
