import { NextRequest } from "next/server";
import { pool } from "@/lib/supabase-db";
import { success, error } from "@/lib/response";
import { verifyAccessToken } from "@/lib/jwt";
import { connectDB } from "@/lib/db";
import User from "@/models/User";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const search = searchParams.get("search");
    
    let currentRequesterId = "";
    const authHeader = req.headers.get("authorization");
    if (authHeader && authHeader.startsWith("Bearer ")) {
      try {
        const decoded = verifyAccessToken(authHeader.split(" ")[1]) as any;
        if (decoded && decoded.id) currentRequesterId = decoded.id;
      } catch (e) {}
    }

    await connectDB();

    let query = `
      SELECT p.*,
        (SELECT COUNT(*) FROM social_likes WHERE post_id = p.id) as likes_count,
        (SELECT COUNT(*) FROM social_comments WHERE post_id = p.id) as comments_count,
        (SELECT COUNT(*) FROM social_views WHERE post_id = p.id) as views_count,
        EXISTS(SELECT 1 FROM social_likes WHERE post_id = p.id AND user_id = $1) as liked_by_me
      FROM social_posts p
      WHERE 1=1
    `;
    let params: any[] = [currentRequesterId];

    if (userId) {
      query += ` AND p.user_id = $2 `;
      params.push(userId);
    }
    
    if (search) {
      const searchParamIdx = params.length + 1;
      
      if (search.startsWith('@')) {
        const rawHandle = search.substring(1).toLowerCase();
        const cleanHandle = rawHandle.replace('user_', '');
        
        // Find users matching handle or ID
        const users = await User.find({
          $or: [
            { name: new RegExp(rawHandle, 'i') },
            { _id: rawHandle.length === 24 ? rawHandle : { $exists: true } }
          ]
        }).select("_id");
        
        const allUserIds = (await User.find({}).select("_id")).map(u => u._id.toString());
        const partialMatches = allUserIds.filter(id => id.toLowerCase().includes(cleanHandle));
        const foundUserIds = [...new Set([...users.map(u => u._id.toString()), ...partialMatches])];
        
        if (foundUserIds.length > 0) {
           // Search in Post Content, OR Comment Content, OR the Author themselves
           query += ` AND (
                p.user_id = ANY($${searchParamIdx}) 
                OR p.content ILIKE $${searchParamIdx + 1}
                OR EXISTS(SELECT 1 FROM social_comments WHERE post_id = p.id AND content ILIKE $${searchParamIdx + 1})
           ) `;
           params.push(foundUserIds);
           params.push(`%${search}%`);
        } else {
           query += ` AND (
                p.content ILIKE $${searchParamIdx}
                OR EXISTS(SELECT 1 FROM social_comments WHERE post_id = p.id AND content ILIKE $${searchParamIdx})
           ) `;
           params.push(`%${search}%`);
        }
      } else {
        // Just hashtag or keyword: check Posts AND Comments
        query += ` AND (
            p.content ILIKE $${searchParamIdx}
            OR EXISTS(SELECT 1 FROM social_comments WHERE post_id = p.id AND content ILIKE $${searchParamIdx})
        ) `;
        params.push(`%${search}%`);
      }
    }

    query += ` ORDER BY p.created_at DESC `;

    const { rows } = await pool.query(query, params);

    // Enriching results
    const userIdsInPosts = [...new Set(rows.map((r: any) => r.user_id))];
    const usersInPosts = await User.find({ _id: { $in: userIdsInPosts } }).select("name profilePhoto");
    
    const userMap = usersInPosts.reduce((acc: any, u: any) => {
      acc[u._id.toString()] = {
        name: u.name,
        avatar: u.profilePhoto?.url || null
      };
      return acc;
    }, {});

    const enrichedRows = rows.map((r: any) => ({
      ...r,
      user: userMap[r.user_id] || { name: "Unknown User", avatar: null },
      likes_count: parseInt(r.likes_count),
      comments_count: parseInt(r.comments_count),
      views_count: parseInt(r.views_count)
    }));

    return success(enrichedRows);

  } catch (err: any) {
    console.error("SOCIAL GET ERROR:", err);
    return error(err.message || "Failed to fetch social posts");
  }
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return error("Unauthorized", 401);
    }

    const token = authHeader.split(" ")[1];
    const decoded = verifyAccessToken(token) as any;
    if (!decoded || !decoded.id) {
      return error("Invalid token", 401);
    }

    const { content, type, media_urls } = await req.json();

    if (!content || !type) {
      return error("Content and type are required", 400);
    }

    const dbMediaUrl = media_urls && media_urls.length > 0 ? JSON.stringify(media_urls) : null;

    let rows;
    try {
      const res = await pool.query(
        "INSERT INTO social_posts (user_id, content, type, media_url) VALUES ($1, $2, $3, $4) RETURNING *",
        [decoded.id, content, type, dbMediaUrl]
      );
      rows = res.rows;
    } catch (e: any) {
      return error("Database error: " + e.message, 500);
    }

    return success(rows[0]);
  } catch (err: any) {
    console.error("SOCIAL POST ERROR:", err);
    return error(err.message || "Failed to create social post");
  }
}
