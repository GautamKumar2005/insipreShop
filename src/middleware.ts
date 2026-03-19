export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { verifyAccessToken } from "@/lib/jwt";
import { ROLES } from "@/lib/constants";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // ✅ PUBLIC ROUTES (NO AUTH REQUIRED)
  if (
    pathname.startsWith("/api/auth") ||
    pathname === "/api/health" ||
    pathname === "/api/cloudinary-sign" ||
    pathname.startsWith("/api/socket/io") || 
    pathname.startsWith("/api/products") || // products + products/[id]
    pathname.startsWith("/api/search") || // Allow search API publicly
    pathname.startsWith("/api/feedback") || // Allow feedback submissions publicly
    (pathname.startsWith("/api/social") && !pathname.startsWith("/api/social/follow")) || // Allow guests to view social hub (but NOT follow actions)
    (pathname.startsWith("/api/users") && req.method === "GET") // Allow guests to view public user data ONLY
  ) {
    return NextResponse.next();
  }

  // 🔐 AUTH CHECK
  const authHeader = req.headers.get("authorization");
  const token =
    authHeader?.startsWith("Bearer ")
      ? authHeader.split(" ")[1]
      : req.cookies.get("accessToken")?.value;

  if (!token) {
    return NextResponse.json(
      { success: false, message: "Unauthorized" },
      { status: 401 }
    );
  }

  let decoded: any;
  try {
    decoded = verifyAccessToken(token);
  } catch (err) {
    return NextResponse.json(
      { success: false, message: "Invalid or expired token" },
      { status: 401 }
    );
  }

  if (!decoded?.id || !decoded?.role) {
    return NextResponse.json(
      { success: false, message: "Invalid token payload" },
      { status: 401 }
    );
  }

  // 🔒 ROLE BASED ACCESS
  if (pathname.startsWith("/api/admin") && decoded.role !== ROLES.ADMIN) {
    return NextResponse.json(
      { success: false, message: "Admin access only" },
      { status: 403 }
    );
  }

  if (pathname.startsWith("/api/seller") && decoded.role !== ROLES.SELLER) {
    return NextResponse.json(
      { success: false, message: "Seller access only" },
      { status: 403 }
    );
  }

  if (pathname.startsWith("/api/delivery") && decoded.role !== ROLES.DELIVERY) {
    return NextResponse.json(
      { success: false, message: "Delivery access only" },
      { status: 403 }
    );
  }

  // ✅ PASS USER DATA TO API
  const headers = new Headers(req.headers);
  headers.set("x-user-id", decoded.id);
  headers.set("x-user-role", decoded.role);

  return NextResponse.next({
    request: { headers },
  });
}

export const config = {
  matcher: ["/api/:path*"],
};
