"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { 
  Eye, 
  Heart, 
  Share2, 
  TrendingUp, 
  Sparkles,
  Award
} from "lucide-react";
import { MediaCarousel } from "@/components/social/MediaCarousel";
import { PostInteractions } from "@/components/social/PostInteractions";
import { FormattedText } from "@/components/social/FormattedText";
import { Card } from "@/components/ui/Card";

interface SocialPost {
  id: string;
  user_id: string;
  content: string;
  type: string;
  media_url?: string;
  created_at: string;
  likes_count: number;
  comments_count: number;
  views_count: number;
  shares_count: number;
  liked_by_me?: boolean;
  user?: {
    name: string;
    avatar: string | null;
  };
}

interface TrendingData {
  topViewed: SocialPost[];
  topLiked: SocialPost[];
  topShared: SocialPost[];
}

export default function TrendingPage() {
  const [data, setData] = useState<TrendingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"views" | "likes" | "shares">("views");

  useEffect(() => {
    async function fetchTrending() {
      try {
        const token = window.localStorage.getItem("token");
        const res = await fetch("/api/social/trending", {
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          }
        });
        const json = await res.json();
        if (json.success) {
          setData(json.data);
        }
      } catch (err) {
        console.error("Error fetching trending pages data:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchTrending();
  }, []);

  if (loading) {
    return (
      <div className="py-12 flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-gray-500 font-bold dark:text-gray-400 animate-pulse">Curating trending posts...</p>
      </div>
    );
  }

  const renderPostList = (posts: SocialPost[], statType: "views" | "likes" | "shares") => {
    if (!posts || posts.length === 0) {
      return (
        <div className="text-center py-16 bg-white dark:bg-[#0a0a0a] rounded-3xl border border-gray-100 dark:border-gray-900 shadow-inner">
          <p className="text-gray-400 dark:text-gray-600 font-medium">No trending posts found in this section</p>
        </div>
      );
    }

    const badgeConfig = {
      views: {
        bg: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
        icon: Eye,
        label: "Views",
      },
      likes: {
        bg: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
        icon: Heart,
        label: "Likes",
      },
      shares: {
        bg: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
        icon: Share2,
        label: "Shares",
      },
    };

    const config = badgeConfig[statType];
    const IconComponent = config.icon;

    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-3 duration-300">
        {posts.map((post, index) => {
          // Get specific count for highlight
          const statValue = 
            statType === "views" ? post.views_count :
            statType === "likes" ? post.likes_count :
            post.shares_count;

          return (
            <Card 
              key={post.id} 
              className="p-0 border-none shadow-xl bg-white dark:bg-[#0c0c0c] rounded-[2rem] overflow-hidden hover:shadow-2xl transition-all group mb-6 border border-gray-100 dark:border-gray-900 relative"
            >
              {/* Rank Highlight Badge */}
              <div className="absolute top-6 right-6 z-10 flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-[10px] font-black uppercase tracking-wider shadow-md">
                <Award size={12} />
                <span>Rank #{index + 1}</span>
              </div>

              <div className="p-6 md:p-8">
                {/* Author Info */}
                <div className="flex items-center gap-4 mb-6">
                  <Link href={`/social/profile/${post.user_id}`}>
                    <div className="w-12 h-12 rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-800 shadow-sm transition-transform active:scale-95 flex-shrink-0 bg-purple-100 flex items-center justify-center font-bold text-purple-600">
                      {post.user?.avatar ? (
                        <img src={post.user.avatar} className="w-full h-full object-cover" alt="Author avatar" />
                      ) : (
                        post.user?.name?.[0] || 'U'
                      )}
                    </div>
                  </Link>
                  <div className="flex-1 min-w-0">
                    <Link href={`/social/profile/${post.user_id}`} className="hover:underline font-extrabold text-gray-900 dark:text-white truncate block text-base">
                      {post.user?.name || "Author"}
                    </Link>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                        {new Date(post.created_at).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric"
                        })}
                      </span>
                      <div className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-700"></div>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${config.bg}`}>
                        <IconComponent size={10} strokeWidth={2.5} />
                        <span>{statValue?.toLocaleString() || 0} {config.label}</span>
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* Content Text */}
                <div className="text-gray-800 dark:text-gray-200 text-base leading-relaxed font-medium mb-6">
                  <FormattedText text={post.content} />
                </div>

                {/* Media Files */}
                <MediaCarousel mediaString={post.media_url} type="page" />
                
                {/* Interactions Row */}
                <div className="mt-6 pt-4 border-t border-gray-50 dark:border-gray-900">
                  <PostInteractions 
                    postId={post.id}
                    initialLikes={post.likes_count || 0}
                    initialComments={post.comments_count || 0}
                    initialViews={post.views_count || 0}
                    isLikedInitially={post.liked_by_me || false}
                  />
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-3 duration-400">
      {/* Compact Header */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center shadow-md shadow-purple-500/20 shrink-0">
          <TrendingUp size={16} className="text-white" />
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white tracking-tight leading-none">
            What&apos;s Hot
          </h1>
          <p className="text-[11px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">
            Real-time top content
          </p>
        </div>
      </div>

      {/* Compact Tab Selector */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveTab("views")}
          className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-2xl border text-[11px] font-extrabold uppercase tracking-wider transition-all duration-200 active:scale-95 ${
            activeTab === "views"
              ? "bg-blue-500/10 border-blue-400/40 text-blue-600 dark:text-blue-400 shadow-sm"
              : "bg-white dark:bg-[#0d0d0d] border-gray-100 dark:border-gray-900 text-gray-400 hover:text-blue-500"
          }`}
        >
          <Eye size={13} />
          <span className="hidden xs:inline">Views</span>
          <span className="xs:hidden">👁️</span>
        </button>
        <button
          onClick={() => setActiveTab("likes")}
          className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-2xl border text-[11px] font-extrabold uppercase tracking-wider transition-all duration-200 active:scale-95 ${
            activeTab === "likes"
              ? "bg-rose-500/10 border-rose-400/40 text-rose-600 dark:text-rose-400 shadow-sm"
              : "bg-white dark:bg-[#0d0d0d] border-gray-100 dark:border-gray-900 text-gray-400 hover:text-rose-500"
          }`}
        >
          <Heart size={13} />
          <span className="hidden xs:inline">Likes</span>
          <span className="xs:hidden">❤️</span>
        </button>
        <button
          onClick={() => setActiveTab("shares")}
          className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-2xl border text-[11px] font-extrabold uppercase tracking-wider transition-all duration-200 active:scale-95 ${
            activeTab === "shares"
              ? "bg-emerald-500/10 border-emerald-400/40 text-emerald-600 dark:text-emerald-400 shadow-sm"
              : "bg-white dark:bg-[#0d0d0d] border-gray-100 dark:border-gray-900 text-gray-400 hover:text-emerald-500"
          }`}
        >
          <Share2 size={13} />
          <span className="hidden xs:inline">Shares</span>
          <span className="xs:hidden">🔗</span>
        </button>
      </div>

      {/* Clicked Section Display Area */}
      <div className="min-h-[300px]">
        {activeTab === "views" && data && renderPostList(data.topViewed, "views")}
        {activeTab === "likes" && data && renderPostList(data.topLiked, "likes")}
        {activeTab === "shares" && data && renderPostList(data.topShared, "shares")}
      </div>
    </div>
  );
}
