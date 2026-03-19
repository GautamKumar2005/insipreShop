import { NextResponse } from "next/server";
import { ROLES } from "@/lib/constants";

export function roleMiddleware(allowedRoles: string[]) {
  return async (req: Request) => {
    const user = (req as any).user;

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    if (!allowedRoles.includes(user.role)) {
      return NextResponse.json(
        { success: false, message: "Forbidden" },
        { status: 403 }
      );
    }

    return null;
  };
}
