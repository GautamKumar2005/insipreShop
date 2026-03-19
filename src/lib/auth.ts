export const runtime = "nodejs"; // ⚠ Important: JWT works only in Node runtime
import { verifyAccessToken } from "./jwt";
import User from "@/models/User";
import { connectDB } from "@/lib/db";

export async function getAuthUser(req: Request) {
  try {
    await connectDB();

    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return null;
    }

    const token = authHeader.split(" ")[1];
    if (!token) return null;

    const decoded: any = verifyAccessToken(token);
    if (!decoded || !decoded.id) return null;

    const user = await User.findById(decoded.id).select("-password");
    if (!user) return null;

    return user;
  } catch (err) {
    return null;
  }
}
