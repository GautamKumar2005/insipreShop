import { NextRequest } from "next/server";
import { pool } from "@/lib/supabase-db";
import { success, error } from "@/lib/response";
import { connectDB } from "@/lib/db";
import User from "@/models/User";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    // 1. Check if we have any social posts of type 'page' or 'post'
    const countRes = await pool.query("SELECT COUNT(*) FROM social_posts WHERE type IN ('page', 'post')");
    const pageCount = parseInt(countRes.rows[0].count);

    if (pageCount === 0) {
      // Find some active users to attribute posts to
      const users = await User.find().limit(3);
      if (users.length > 0) {
        const dummyPages = [
          {
            content: "🌟 The Future of Decentralized E-Commerce: Exploring Web3 and Social Marketplaces. Read our in-depth analysis on how peer-to-peer selling is changing in 2026. #ecommerce #future",
            media: "https://images.unsplash.com/photo-1557821552-17105176677c?w=800"
          },
          {
            content: "🎨 Premium UI/UX Design Trends that WOW users. A comprehensive guide to glassmorphism, tailored HSL color palettes, and micro-interactions for modern applications. #design #uiux",
            media: "https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=800"
          },
          {
            content: "📈 How to Scale Your Next.js App to Millions of Views: Database pooling, dynamic rendering optimizations, and edge caching strategies. #nextjs #webdev",
            media: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800"
          },
          {
            content: "💼 Work from Home vs. Hybrid: The Ultimate Productivity Guide. Analyzing team performance metrics, communication tools, and mental wellbeing in remote setups. #work #productivity",
            media: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800"
          },
          {
            content: "🚀 Starting Your SaaS in 2026: Lean development, bootstrapping vs. VC funding, and building a community-first brand. #saas #startup",
            media: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800"
          }
        ];

        for (let i = 0; i < dummyPages.length; i++) {
          const user = users[i % users.length];
          const postResult = await pool.query(
            "INSERT INTO social_posts (user_id, content, type, media_url) VALUES ($1, $2, $3, $4) RETURNING id",
            [user._id.toString(), dummyPages[i].content, "page", JSON.stringify([dummyPages[i].media])]
          );
          const postId = postResult.rows[0].id;

          // Seed views
          const viewsCount = Math.floor(Math.random() * 200) + 50;
          for (let v = 0; v < viewsCount; v++) {
            await pool.query(
              "INSERT INTO social_views (post_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
              [postId, `user_view_${v}`]
            );
          }

          // Seed likes
          const likesCount = Math.floor(Math.random() * (viewsCount - 10)) + 5;
          for (let l = 0; l < likesCount; l++) {
            await pool.query(
              "INSERT INTO social_likes (post_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
              [postId, `user_like_${l}`]
            );
          }

          // Seed shares (via social_messages content containing the post URL)
          const sharesCount = Math.floor(Math.random() * 15) + 2;
          for (let s = 0; s < sharesCount; s++) {
            await pool.query(
              "INSERT INTO social_messages (sender_id, receiver_id, content) VALUES ($1, $2, $3)",
              ["system", `receiver_${s}`, `Check out this post: http://localhost:3000/social/post/${postId}`]
            );
          }
        }
      }
    }

    // Query template to select posts with stats
    const query = `
      SELECT p.*,
        (SELECT COUNT(*) FROM social_likes WHERE post_id = p.id) as likes_count,
        (SELECT COUNT(*) FROM social_comments WHERE post_id = p.id) as comments_count,
        (SELECT COUNT(*) FROM social_views WHERE post_id = p.id) as views_count,
        (SELECT COUNT(*) FROM social_messages WHERE content LIKE '%' || p.id || '%') as shares_count
      FROM social_posts p
      WHERE p.type IN ('page', 'post')
    `;

    const topViewedRes = await pool.query(`${query} ORDER BY views_count DESC LIMIT 5`);
    const topLikedRes = await pool.query(`${query} ORDER BY likes_count DESC LIMIT 5`);
    const topSharedRes = await pool.query(`${query} ORDER BY shares_count DESC LIMIT 5`);

    // Helper to enrich post lists with author user details
    const enrichPosts = async (rows: any[]) => {
      if (rows.length === 0) return [];
      const userIds = [...new Set(rows.map(r => r.user_id))];
      const users = await User.find({ _id: { $in: userIds } }).select("name profilePhoto");
      const userMap = users.reduce((acc: any, u: any) => {
        acc[u._id.toString()] = {
          name: u.name,
          avatar: u.profilePhoto?.url || null
        };
        return acc;
      }, {});

      return rows.map(r => ({
        ...r,
        user: userMap[r.user_id] || { name: "Unknown User", avatar: null },
        likes_count: parseInt(r.likes_count) || 0,
        comments_count: parseInt(r.comments_count) || 0,
        views_count: parseInt(r.views_count) || 0,
        shares_count: parseInt(r.shares_count) || 0
      }));
    };

    const topViewed = await enrichPosts(topViewedRes.rows);
    const topLiked = await enrichPosts(topLikedRes.rows);
    const topShared = await enrichPosts(topSharedRes.rows);

    return success({
      topViewed,
      topLiked,
      topShared
    });

  } catch (err: any) {
    return error(err.message || "Failed to fetch trending pages");
  }
}
