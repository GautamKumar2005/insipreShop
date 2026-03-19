// import { NextResponse } from "next/server";
// import { verifyAccessToken } from "@/lib/jwt";
// import User from "@/models/User";
// import { connectDB } from "@/lib/db";

// export async function authMiddleware(req: Request) {
//   try {
//     await connectDB();

//     const authHeader = req.headers.get("authorization");

//     if (!authHeader || !authHeader.startsWith("Bearer ")) {
//       return NextResponse.json(
//         { success: false, message: "Unauthorized" },
//         { status: 401 }
//       );
//     }

//     const token = authHeader.split(" ")[1];
//     const decoded: any = verifyAccessToken(token);

//     const user = await User.findById(decoded.id).select("-password");
//     if (!user) {
//       return NextResponse.json(
//         { success: false, message: "User not found" },
//         { status: 401 }
//       );
//     }

//     // attach user to request (custom)
//     (req as any).user = user;

//     return null; // allow request to continue
//   } catch (err) {
//     return NextResponse.json(
//       { success: false, message: "Invalid token" },
//       { status: 401 }
//     );
//   }
// }
