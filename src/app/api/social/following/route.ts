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

    const followingRes = await pool.query(
      "SELECT following_id FROM social_follows WHERE follower_id = $1 ORDER BY created_at DESC",
      [userId]
    );

    const followingIds = followingRes.rows.map(r => r.following_id);
    const validIds = followingIds.filter(id => /^[0-9a-fA-F]{24}$/.test(id));
    if (validIds.length === 0) return success([]);

    await connectDB();
    const users = await User.find({ _id: { $in: validIds } }).select("name profilePhoto _id username");
    
    const result = users.map(u => ({
      _id: u._id,
      name: u.name,
      username: u.username || `user_${u._id.toString().substring(0,6)}`,
      avatar: u.profilePhoto?.url || null
    }));

    return success(result);
  } catch (err: any) {
    return error(err.message || "Failed to fetch following");
  }
}
