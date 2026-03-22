import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import { success, error } from "@/lib/response";

/*
  GET /api/users/:id
*/
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    const user = await User.findById(id).select("_id name username bio profilePhoto role followers following isOnline lastSeen");
    if (!user) return error("User not found", 404);

    return success(user);
  } catch (err: any) {
    return error(err.message || "Failed to fetch user");
  }
}

/*
  PUT /api/users/:id
*/
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    const body = await req.json();

    // 🚫 never allow password update here
    delete body.password;

    // 🚀 Unique username check
    if (body.username) {
      const trimmedUsername = body.username.trim().toLowerCase();
      if (!trimmedUsername.match(/^[a-zA-Z0-9_]+$/)) {
        return error("Username can only contain letters, numbers and underscores", 400);
      }
      
      const existing = await User.findOne({ 
        username: trimmedUsername, 
        _id: { $ne: id } 
      });
      if (existing) return error("Username already taken", 400);
      
      body.username = trimmedUsername;
    }

    const user = await User.findByIdAndUpdate(id, body, {
      new: true,
    }).select("-password");

    if (!user) return error("User not found", 404);

    return success(user);
  } catch (err: any) {
        return error(err.message || "Failed to update user");
  }
}

/*
  DELETE /api/users/:id
*/
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;

    const user = await User.findByIdAndDelete(id);
    if (!user) return error("User not found", 404);

    return success({ message: "User deleted successfully" });
  } catch (err: any) {
    return error(err.message || "Failed to delete user");
  }
}
