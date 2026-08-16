export const runtime = "nodejs";
import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import DeletedUser from "@/models/DeletedUser";
import UserActivity from "@/models/UserActivity";
import { success, error } from "@/lib/response";
import { ROLES } from "@/lib/constants";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const role = req.headers.get("x-user-role");
    if (role !== ROLES.ADMIN) return error("Unauthorized", 403);

    const { id } = await context.params;

    const deletedUser = await DeletedUser.findById(id);
    if (!deletedUser) return error("Deleted user profile not found", 404);

    const activities = await UserActivity.find({ email: deletedUser.email }).sort({ timestamp: -1 });

    // Calculate total time spent
    const totalSeconds = activities.reduce((sum, act) => sum + (act.duration || 0), 0);
    const totalMinutesSpent = Math.round(totalSeconds / 60);

    // Calculate peak hour
    const hourCounts = Array(24).fill(0);
    activities.forEach(act => {
      const hr = new Date(act.timestamp).getHours();
      hourCounts[hr] += 1;
    });
    let peakHour = 0;
    let maxCount = 0;
    for (let i = 0; i < 24; i++) {
      if (hourCounts[i] > maxCount) {
        maxCount = hourCounts[i];
        peakHour = i;
      }
    }
    const peakHourStr = maxCount > 0 ? `${peakHour}:00 - ${(peakHour + 1) % 24}:00` : "No activity logs";

    return success({
      profile: {
        id: deletedUser.originalUserId,
        name: deletedUser.name,
        email: deletedUser.email,
        phone: deletedUser.phone,
        role: deletedUser.role,
        createdAt: deletedUser.createdAt,
        deletedAt: deletedUser.deletedAt,
        deletedBy: deletedUser.deletedBy,
      },
      stats: {
        totalMinutesSpent,
        peakHour: peakHourStr,
        productsCount: deletedUser.archivedData?.productsCount || 0,
        ordersCount: deletedUser.role === "buyer" ? (deletedUser.archivedData?.profile?.ordersCount || 0) : 0,
        moneyTotal: 0,
        reviewsCount: deletedUser.archivedData?.reviewsCount || 0,
        deliveriesCount: 0,
        socialPostsCount: deletedUser.archivedData?.socialPostsCount || 0,
        socialLikesCount: 0,
        socialCommentsCount: deletedUser.archivedData?.commentsCount || 0,
      }
    });
  } catch (err: any) {
    return error(err.message || "Failed to fetch deleted user summary", 500);
  }
}
