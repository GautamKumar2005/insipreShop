"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { MediaCarousel } from "@/components/social/MediaCarousel";
import { PostInteractions } from "@/components/social/PostInteractions";
import { FormattedText } from "@/components/social/FormattedText";
import { Users, Compass, Plus, Heart, Eye, MessageCircle } from "lucide-react";

interface SocialPost {
  id: string;
  user_id: string;
  content: string;
  type: 'post' | 'reel' | 'tweet' | 'page';
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
    username?: string;
  };
}

const CATEGORIES = [
  { id: "all", label: "🌟 All", full: "All Pages" },
  { id: "clothing", label: "👕 Clothing", full: "Clothing & Fashion" },
  { id: "electronics", label: "⚡ Electronics", full: "Electronics & Tech" },
  { id: "books", label: "📚 Books", full: "Books & Literature" },
  { id: "other", label: "📦 Other", full: "Other Categories" },
] as const;

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  clothing: ["clothing", "apparel", "fashion", "wear", "shirt", "t-shirt", "jeans", "shoes", "jacket", "dress", "pant"],
  electronics: ["electronics", "tech", "phone", "laptop", "computer", "gadget", "headphone", "screen", "device"],
  books: ["books", "novel", "reading", "literature", "guide", "study", "author", "pages"],
};

function formatRelativeTime(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d`;
  return new Date(dateStr).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

export default function SocialHub() {
  const searchParams = useSearchParams();
  const globalSearch = searchParams?.get("search") || "";
  
  const { user } = useAuth();
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [siteUsers, setSiteUsers] = useState<any[]>([]);
  const [connectedUserIds, setConnectedUserIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const [subTab, setSubTab] = useState<"known" | "new">("new");
  const [activeCategory, setActiveCategory] = useState<string>("all");

  const fetchPostsAndUsers = async () => {
    try {
      setLoading(true);
      const token = window.localStorage.getItem("token");
      
      // Parallel fetches
      const [usersRes, postsRes] = await Promise.all([
        fetch("/api/users"),
        fetch(
          globalSearch.trim()
            ? `/api/social?search=${encodeURIComponent(globalSearch.trim())}`
            : "/api/social",
          { headers: token ? { Authorization: `Bearer ${token}` } : {} }
        ),
      ]);

      const usersData = await usersRes.json();
      if (usersData.success) setSiteUsers(usersData.data);

      const postsData = await postsRes.json();
      if (postsData.success) {
        setPosts(postsData.data.filter((p: SocialPost) => p.type === "page"));
      }

      // Fetch connections if logged in
      if (user && token) {
        const connRes = await fetch(`/api/social/connections?userId=${user.id}&type=accepted`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const connData = await connRes.json();
        if (connData.success) {
          setConnectedUserIds(connData.data.map((c: any) => c.user?._id).filter(Boolean));
        }
      }
    } catch (err) {
      console.error("Error loading feed:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPostsAndUsers();
  }, [user, globalSearch]);

  const matchedUsers = siteUsers.filter(u => {
    const s = globalSearch.toLowerCase().trim();
    if (!s) return false;
    const term = s.startsWith("@") ? s.substring(1) : s;
    const clean = term.replace("user_", "");
    return (
      u.name.toLowerCase().includes(term) ||
      u._id.toString().toLowerCase().includes(clean)
    );
  });

  const getPostScore = (post: SocialPost) =>
    (post.views_count || 0) + (post.likes_count || 0) * 2 + (post.shares_count || 0) * 5;

  const getProcessedPosts = () => {
    let list = [...posts];
    if (subTab === "known") list = list.filter(p => connectedUserIds.includes(p.user_id));
    if (activeCategory !== "all") {
      list = list.filter(post => {
        const lower = post.content.toLowerCase();
        if (activeCategory === "other") {
          return !Object.values(CATEGORY_KEYWORDS).some(kws => kws.some(k => lower.includes(k)));
        }
        return (CATEGORY_KEYWORDS[activeCategory] || []).some(k => lower.includes(k));
      });
    }
    if (subTab === "new") list.sort((a, b) => getPostScore(b) - getPostScore(a));
    else list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    return list;
  };

  const processedPosts = getProcessedPosts();

  // ── Post Card ────────────────────────────────────────────────────────────────
  const PostCard = ({ post }: { post: SocialPost }) => (
    <article className="bg-white dark:bg-[#0d0d0d] rounded-2xl sm:rounded-3xl border border-gray-100 dark:border-gray-900/80 shadow-sm hover:shadow-md transition-all overflow-hidden mb-4">
      {/* Author row */}
      <div className="flex items-center gap-3 px-4 sm:px-5 pt-4 sm:pt-5 pb-3">
        <Link href={`/social/profile/${post.user_id}`} className="shrink-0">
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl overflow-hidden bg-gradient-to-tr from-purple-100 to-pink-100 dark:from-purple-900/40 dark:to-pink-900/40 flex items-center justify-center font-black text-purple-600 border border-purple-100 dark:border-purple-900/30 shadow-sm hover:scale-105 transition-transform text-sm sm:text-base">
            {post.user?.avatar
              ? <img src={post.user.avatar} className="w-full h-full object-cover" alt="" />
              : (post.user?.name?.[0] || "U")}
          </div>
        </Link>
        <div className="flex-1 min-w-0">
          <Link href={`/social/profile/${post.user_id}`} className="hover:underline font-extrabold text-gray-900 dark:text-white text-sm sm:text-base truncate block">
            {post.user?.name || "Anonymous"}
          </Link>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[10px] text-gray-400 font-bold">
              {formatRelativeTime(post.created_at)}
            </span>
            <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-700" />
            <span className="text-[10px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-purple-50 dark:bg-purple-950/30 text-purple-500">
              {post.type}
            </span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 sm:px-5 pb-3 text-sm sm:text-base text-gray-800 dark:text-gray-200 leading-relaxed font-medium">
        <FormattedText text={post.content} />
      </div>

      {/* Media */}
      {post.media_url && (
        <div className="px-0 sm:px-0">
          <MediaCarousel mediaString={post.media_url} type="page" />
        </div>
      )}

      {/* Stats row */}
      <div className="flex items-center gap-4 px-4 sm:px-5 py-2 text-[11px] text-gray-400 font-bold border-t border-gray-50 dark:border-gray-900/60 mt-1">
        <span className="flex items-center gap-1">
          <Eye size={12} /> {post.views_count}
        </span>
        <span className="flex items-center gap-1">
          <Heart size={12} /> {post.likes_count}
        </span>
        <span className="flex items-center gap-1">
          <MessageCircle size={12} /> {post.comments_count}
        </span>
      </div>

      {/* Interactions */}
      <div className="px-2 sm:px-3 pb-3">
        <PostInteractions
          postId={post.id}
          initialLikes={post.likes_count || 0}
          initialComments={post.comments_count || 0}
          initialViews={post.views_count || 0}
          isLikedInitially={post.liked_by_me || false}
        />
      </div>
    </article>
  );

  // ── Skeleton Loader ──────────────────────────────────────────────────────────
  const Skeleton = () => (
    <div className="bg-white dark:bg-[#0d0d0d] rounded-2xl sm:rounded-3xl border border-gray-100 dark:border-gray-900/80 p-4 sm:p-5 mb-4 animate-pulse">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-gray-200 dark:bg-gray-800" />
        <div className="flex-1 space-y-2">
          <div className="h-3 w-32 bg-gray-200 dark:bg-gray-800 rounded-full" />
          <div className="h-2.5 w-20 bg-gray-100 dark:bg-gray-900 rounded-full" />
        </div>
      </div>
      <div className="space-y-2">
        <div className="h-3 w-full bg-gray-100 dark:bg-gray-900 rounded-full" />
        <div className="h-3 w-4/5 bg-gray-100 dark:bg-gray-900 rounded-full" />
        <div className="h-3 w-2/3 bg-gray-100 dark:bg-gray-900 rounded-full" />
      </div>
      <div className="mt-4 h-44 bg-gray-100 dark:bg-gray-900 rounded-2xl" />
    </div>
  );

  // ── Empty State ──────────────────────────────────────────────────────────────
  const EmptyState = ({ isConnections }: { isConnections?: boolean }) => (
    <div className="flex flex-col items-center justify-center py-16 sm:py-20 px-4 text-center bg-white dark:bg-[#0d0d0d] rounded-2xl sm:rounded-3xl border border-gray-100 dark:border-gray-900 shadow-sm">
      <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-purple-50 dark:bg-purple-950/20 flex items-center justify-center mb-4 text-2xl sm:text-3xl">
        {isConnections ? "🤝" : "📭"}
      </div>
      <h3 className="font-extrabold text-base sm:text-lg text-gray-700 dark:text-gray-300 mb-1.5">
        {isConnections ? "No connections yet" : "No pages found"}
      </h3>
      <p className="text-xs sm:text-sm text-gray-400 dark:text-gray-500 font-medium max-w-xs">
        {isConnections
          ? "Connect with sellers to see their latest pages and updates here."
          : activeCategory !== "all"
            ? "Try selecting a different category or switch to Discover."
            : "Be the first to publish — create your first page from the dashboard!"}
      </p>
      {!isConnections && (
        <Link
          href="/social/dashboard"
          className="mt-5 inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-extrabold px-4 py-2.5 rounded-full transition-all shadow shadow-purple-500/20 active:scale-95"
        >
          <Plus size={14} /> Create a Page
        </Link>
      )}
    </div>
  );

  // ── Main Render ──────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4 sm:space-y-5 animate-in fade-in slide-in-from-bottom-3 duration-400">
      {/* ── Search Mode ─────────────────────────────────────────────────────── */}
      {globalSearch.trim() ? (
        <div className="space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white">
              Search Results
            </h1>
            <p className="text-xs text-gray-400 font-bold mt-0.5">
              Showing results for &quot;{globalSearch}&quot;
            </p>
          </div>

          {/* Matched users */}
          {matchedUsers.length > 0 && (
            <section>
              <h2 className="text-[10px] uppercase font-black text-gray-400 tracking-[0.2em] mb-3">
                People
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {matchedUsers.map(u => (
                  <Link
                    key={u._id}
                    href={`/social/profile/${u._id}`}
                    className="flex items-center gap-3 p-3 sm:p-4 bg-white dark:bg-[#0d0d0d] rounded-2xl border border-gray-100 dark:border-gray-900 shadow-sm hover:shadow-md hover:border-purple-200 dark:hover:border-purple-900 transition-all group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-100 to-pink-100 dark:from-purple-900/40 dark:to-pink-900/40 flex items-center justify-center font-black text-purple-600 overflow-hidden border border-purple-100 dark:border-purple-900/30 shrink-0 group-hover:scale-105 transition-transform">
                      {u.profilePhoto?.url
                        ? <img src={u.profilePhoto.url} className="w-full h-full object-cover" alt="" />
                        : u.name[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-extrabold text-sm text-gray-900 dark:text-white truncate group-hover:text-purple-600 transition-colors">
                        {u.name}
                      </p>
                      <p className="text-[10px] text-gray-400 font-bold">
                        @{u.username || `user_${u._id.slice(-6)}`}
                      </p>
                    </div>
                    <span className="text-[10px] font-black uppercase px-2 py-1 rounded-lg bg-purple-50 dark:bg-purple-950/20 text-purple-600 group-hover:bg-purple-100 transition-colors shrink-0">
                      View
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Matched posts */}
          <section>
            {matchedUsers.length > 0 && (
              <h2 className="text-[10px] uppercase font-black text-gray-400 tracking-[0.2em] mb-3">
                Pages
              </h2>
            )}
            {loading ? (
              <>{[0,1,2].map(i => <Skeleton key={i} />)}</>
            ) : posts.length > 0 ? (
              posts.map(post => <PostCard key={post.id} post={post} />)
            ) : (
              <EmptyState />
            )}
          </section>
        </div>

      ) : (
        /* ── Browse Mode ──────────────────────────────────────────────────── */
        <>
          {/* Header row */}
          <div className="flex items-center justify-between gap-3">
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white tracking-tight">
                Pages Feed
              </h1>
              <p className="text-[11px] text-gray-400 font-bold mt-0.5 uppercase tracking-wider">
                Discover products & updates
              </p>
            </div>
            <Link
              href="/social/dashboard"
              className="inline-flex items-center gap-1.5 bg-purple-600 hover:bg-purple-700 text-white text-[11px] font-extrabold px-3 py-2 rounded-full transition-all shadow shadow-purple-500/20 active:scale-95 shrink-0 uppercase tracking-wide"
            >
              <Plus size={13} />
              <span className="hidden xs:inline">Create</span>
            </Link>
          </div>

          {/* Sub-tab selector */}
          <div className="flex bg-gray-100 dark:bg-[#111] p-1 rounded-2xl gap-1">
            <button
              onClick={() => setSubTab("new")}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-[11px] uppercase tracking-wider font-extrabold transition-all duration-300 ${
                subTab === "new"
                  ? "bg-white dark:bg-[#1a1a1a] text-purple-600 shadow-sm"
                  : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              }`}
            >
              <Compass size={13} />
              <span className="hidden sm:inline">Discover</span>
              <span className="sm:hidden">New</span>
            </button>
            <button
              onClick={() => {
                if (!user) {
                  alert("Please login to view your connections feed!");
                  return;
                }
                setSubTab("known");
              }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-[11px] uppercase tracking-wider font-extrabold transition-all duration-300 ${
                subTab === "known"
                  ? "bg-white dark:bg-[#1a1a1a] text-purple-600 shadow-sm"
                  : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              }`}
            >
              <Users size={13} />
              <span className="hidden sm:inline">My Connections</span>
              <span className="sm:hidden">Known</span>
            </button>
          </div>

          {/* Category pills */}
          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar -mx-1 px-1">
            {CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`whitespace-nowrap flex-shrink-0 px-3 py-1.5 rounded-full text-[11px] font-extrabold border transition-all duration-200 active:scale-95 ${
                  activeCategory === cat.id
                    ? "bg-purple-600 text-white border-purple-600 shadow shadow-purple-500/20"
                    : "bg-white dark:bg-[#0d0d0d] border-gray-100 dark:border-gray-900 text-gray-500 hover:border-purple-200 dark:hover:border-purple-900 hover:text-purple-600"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Feed list */}
          <div>
            {loading ? (
              <>{[0,1,2].map(i => <Skeleton key={i} />)}</>
            ) : processedPosts.length === 0 ? (
              <EmptyState isConnections={subTab === "known"} />
            ) : (
              processedPosts.map(post => <PostCard key={post.id} post={post} />)
            )}
          </div>
        </>
      )}
    </div>
  );
}
