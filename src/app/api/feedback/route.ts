import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import Feedback from "@/models/Feedback";
import { success, error } from "@/lib/response";

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const data = await req.json();

    const { name, email, type, message } = data;

    if (!name || !email || !type || !message) {
      return error("All fields are required", 400);
    }

    const newFeedback = new Feedback({
      name,
      email,
      type,
      message,
    });

    await newFeedback.save();

    return success({ message: "Feedback submitted successfully" });
  } catch (err: any) {
    return error(err.message || "Failed to submit feedback");
  }
}
