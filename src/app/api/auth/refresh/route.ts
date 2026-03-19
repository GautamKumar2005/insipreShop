import { NextRequest } from "next/server";
import { verifyRefreshToken, signAccessToken } from "@/lib/jwt";
import { success, error } from "@/lib/response";

export async function POST(req: NextRequest) {
  try {
    const refreshToken = req.cookies.get("refreshToken")?.value;

    if (!refreshToken) {
      return error("Refresh token missing", 401);
    }

    const decoded: any = verifyRefreshToken(refreshToken);

    const newAccessToken = signAccessToken({
      id: decoded.id,
      role: decoded.role,
    });

    return success({ accessToken: newAccessToken });
  } catch (err: any) {
    return error("Invalid refresh token", 401);
  }
}
