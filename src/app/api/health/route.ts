import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { success, error } from "@/lib/response";

export async function GET(req: NextRequest) {
  try {
    // Try connecting to DB
    await connectDB();

    return success({ status: "ok", message: "Backend & MongoDB connected" });
  } catch (err: any) {
    return error(err.message || "Backend or MongoDB not connected");
  }
}
