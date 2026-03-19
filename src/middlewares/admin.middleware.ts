import { NextResponse } from "next/server";
import { ROLES } from "@/lib/constants";

export async function adminMiddleware(req: Request) {
  const user = (req as any).user;

  if (!user || user.role !== ROLES.ADMIN) {
    return NextResponse.json(
      { success: false, message: "Admin access only" },
      { status: 403 }
    );
  }

  return null;
}
