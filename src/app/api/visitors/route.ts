import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import VisitorCount from "@/models/VisitorCount";
import { success, error } from "@/lib/response";

function getTodayIST() {
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  const ist = new Date(utc + 5.5 * 3600000);
  ist.setHours(0, 0, 0, 0);
  return ist;
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const today = getTodayIST();

    // Find and update today's count, or create it
    const visitor = await VisitorCount.findOneAndUpdate(
      { createdAt: { $gte: today } },
      { $inc: { count: 1 } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return success({ count: visitor.count });
  } catch (err: any) {
    return error(err.message || "Failed to log visit", 500);
  }
}

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const today = getTodayIST();

    const visitor = await VisitorCount.findOne({ createdAt: { $gte: today } });
    const count = visitor ? visitor.count : 0;
    
    return success({ count });
  } catch (err: any) {
    return error(err.message || "Failed to fetch visits", 500);
  }
}

