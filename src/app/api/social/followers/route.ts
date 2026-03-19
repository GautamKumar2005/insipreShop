export const runtime = "nodejs";
import { NextRequest } from "next/server";
import { pool } from "@/lib/supabase-db";
import { success, error } from "@/lib/response";
import { connectDB } from "@/lib/db";
import User from "@/models/User";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    if (!userId) return error("userId is required", 400);

    const followersRes = await pool.query(
      "SELECT follower_id FROM social_follows WHERE following_id = $1 ORDER BY created_at DESC",
      [userId]
    );

    const followerIds = followersRes.rows.map(r => r.follower_id);

    if (followerIds.length === 0) return success([]);

    await connectDB();
    const users = await User.find({ _id: { $in: followerIds } }).select("name profilePhoto _id");
    
    const result = users.map(u => ({
      _id: u._id,
      name: u.name,
      avatar: u.profilePhoto?.url || null
    }));

    return success(result);
  } catch (err: any) {
    return error(err.message || "Failed to fetch followers");
  }
}
