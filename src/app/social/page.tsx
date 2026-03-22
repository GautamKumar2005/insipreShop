"use client";

import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/Card";
import { useAuth } from "@/hooks/useAuth";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { MediaCarousel } from "@/components/social/MediaCarousel";
import { PostInteractions } from "@/components/social/PostInteractions";
import { FormattedText } from "@/components/social/FormattedText";

interface SocialPost {
  id: string;
  user_id: string;
  content: string;
  type: 'post' | 'reel' | 'tweet' | 'page';
  media_url?: string;
  created_at: string;
  likes_count?: number;
  comments_count?: number;
  views_count?: number;
  liked_by_me?: boolean;
  user?: {
    name: string;
    avatar: string | null;
  };
}

const SocialHub = () => {
  const searchParams = useSearchParams();
  const initialSearch = searchParams?.get("search") || "";
  
  const { user } = useAuth();
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [siteUsers, setSiteUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [globalSearch, setGlobalSearch] = useState(initialSearch);

  useEffect(() => {
    setGlobalSearch(searchParams?.get("search") || "");
  }, [searchParams]);

  const fetchPostsAndUsers = async () => {
    try {
      setLoading(true);
      const usersRes = await fetch("/api/users");
      const usersData = await usersRes.json();
      if (usersData.success) setSiteUsers(usersData.data);

      const searchTerms = globalSearch.trim();
      const resUrl = searchTerms ? `/api/social?search=${encodeURIComponent(searchTerms)}` : "/api/social";
      const token = window.localStorage.getItem("token");
      const res = await fetch(resUrl, {
        headers: {
           ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      });
      const data = await res.json();
      if (data.success) {
        setPosts(data.data);
      }
    } catch (err) { } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPostsAndUsers();
  }, [user, globalSearch]);

  const matchedUsers = siteUsers.filter(u => {
      const s = globalSearch.toLowerCase().trim();
      if (!s) return false;
      const term = s.startsWith('@') ? s.substring(1) : s;
      const cleanTerm = term.replace('user_', '');
      
      return (
          u.name.toLowerCase().includes(term) || 
          u._id.toString().toLowerCase().includes(cleanTerm) ||
          u._id.toString().toLowerCase().includes(term)
      );
  });
  
  const PostRenderer = ({ post }: { post: SocialPost }) => (
    <Card className="p-6 border-none shadow-lg bg-white dark:bg-[#111] rounded-3xl hover:shadow-xl transition-all group mb-4">
      <div className="flex gap-4">
        <Link href={`/social/profile/${post.user_id}`}>
          <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white dark:border-gray-800 shadow-sm transition-transform active:scale-90 flex-shrink-0 bg-purple-100 flex items-center justify-center font-bold text-purple-600">
            {post.user?.avatar ? <img src={post.user.avatar} className="w-full h-full object-cover"/> : post.user?.name?.[0]}
          </div>
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Link href={`/social/profile/${post.user_id}`} className="hover:underline font-extrabold text-gray-900 dark:text-gray-100 truncate">
                {post.user?.name || "User"}
              </Link>
              <div className="w-1 h-1 rounded-full bg-gray-300"></div>
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{new Date(post.created_at).toLocaleDateString()}</span>
            </div>
            <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-tighter w-fit ${
              post.type === 'reel' ? 'bg-pink-100 text-pink-600' : 
              post.type === 'tweet' ? 'bg-blue-100 text-blue-600' : 
              'bg-purple-100 text-purple-600'
            }`}>
              {post.type}
            </span>
          </div>

          <div className="relative">
            <div className={`${post.type === 'tweet' ? 'text-xl' : 'text-gray-700 dark:text-gray-300'} leading-relaxed font-medium mb-4`}>
                <FormattedText text={post.content} />
            </div>
            <MediaCarousel mediaString={post.media_url} type={post.type} />
            
            <PostInteractions 
              postId={post.id}
              initialLikes={post.likes_count || 0}
              initialComments={post.comments_count || 0}
              initialViews={post.views_count || 0}
              isLikedInitially={post.liked_by_me || false}
            />
          </div>
        </div>
      </div>
    </Card>
  );

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-2xl mx-auto">
      <div className="mb-10 text-center px-4 pt-10">
        <h1 className="text-4xl md:text-6xl font-black bg-clip-text text-transparent bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 mb-4 tracking-tighter">
          Explore Social
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mb-8 font-medium">Discover stories, mentions, and hashtags globally.</p>
        
        <div className="relative max-w-md mx-auto group">
           <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-pink-500/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
           <input 
             type="text" 
             placeholder="Search #hashtags, @users, or content..."
             className="relative w-full py-5 px-7 rounded-[2rem] bg-white dark:bg-[#0a0a0a] border-none shadow-2xl ring-1 ring-black/5 dark:ring-white/10 focus:ring-2 focus:ring-purple-500 transition-all text-lg font-bold"
             value={globalSearch}
             onChange={(e) => setGlobalSearch(e.target.value)}
           />
           {globalSearch && (
             <button onClick={() => setGlobalSearch("")} className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
               <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/></svg>
             </button>
           )}
        </div>
      </div>
      
      {!user && (
         <div className="mx-4 mb-12">
            <Card className="p-8 border-none shadow-2xl bg-gradient-to-br from-purple-600 to-pink-600 rounded-[2.5rem] relative overflow-hidden group">
               <div className="absolute top-0 right-0 -mt-8 -mr-8 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
               <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="text-center md:text-left">
                     <h2 className="text-2xl font-black text-white mb-2 leading-tight">Join the Inspire Social Community</h2>
                     <p className="text-purple-100 font-medium">Create your own profile, share your stories, and connect with other members.</p>
                  </div>
                  <div className="flex gap-3 shrink-0">
                     <Link href="/auth/login">
                        <button className="px-6 py-3 bg-white text-purple-600 font-black rounded-2xl shadow-lg hover:scale-105 active:scale-95 transition-all">Login</button>
                     </Link>
                     <Link href="/auth/register">
                        <button className="px-6 py-3 bg-purple-500/20 text-white border border-white/30 backdrop-blur-md font-black rounded-2xl shadow-lg hover:bg-white/10 transition-all">Sign Up</button>
                     </Link>
                  </div>
               </div>
            </Card>
         </div>
      )}

      <div className="space-y-12 pb-20 px-2 md:px-0">
         {loading ? (
             <div className="flex flex-col items-center justify-center py-20 gap-4">
               <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
               <p className="text-sm font-black uppercase tracking-widest text-purple-500/50">Fetching results...</p>
             </div>
         ) : !globalSearch.trim() ? (
            <div className="space-y-8">
               {posts.map(post => <PostRenderer key={post.id} post={post} />)}
            </div>
         ) : (
            <div className="space-y-12">
               {matchedUsers.length > 0 && (
                  <section className="animate-in slide-in-from-left duration-500">
                    <h2 className="text-[10px] uppercase font-bold text-gray-400 tracking-[0.3em] mb-4 px-4">Found Profiles</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {matchedUsers.map(u => (
                        <Card key={u._id} className="p-4 flex items-center justify-between border-none shadow-xl bg-white dark:bg-[#0f0f0f] rounded-2xl hover:scale-[1.02] transition-all ring-1 ring-black/5 dark:ring-white/5">
                          <Link href={`/social/profile/${u._id}`} className="flex items-center gap-3 flex-1 group">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-purple-100 to-pink-100 dark:from-purple-900/40 dark:to-pink-900/40 flex items-center justify-center font-bold text-purple-600 overflow-hidden border-2 border-white dark:border-gray-800 shadow-lg group-hover:scale-110 transition-transform relative">
                              {u.profilePhoto?.url ? <img src={u.profilePhoto.url} className="w-full h-full object-cover"/> : u.name[0]}
                              {u.isOnline && (
                                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-[#0f0f0f] shadow-sm animate-pulse" />
                              )}
                            </div>
                            <div className="flex flex-col">
                                <span className="font-black text-sm group-hover:underline">{u.name}</span>
                                <span className="text-[9px] text-gray-400 font-bold uppercase tracking-tight">@{u.username || `user_${u._id.slice(-6)}`}</span>
                            </div>
                          </Link>
                          <Link 
                            href={`/social/inbox?user=${u._id}`}
                            className="text-[9px] font-black uppercase tracking-widest px-5 py-2.5 rounded-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-lg active:scale-95 transition-all flex items-center gap-2"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                            Message
                          </Link>
                        </Card>
                      ))}
                    </div>
                  </section>
               )}

               {(posts.length > 0) ? (
                  <section className="animate-in fade-in duration-700">
                    <h2 className="text-[10px] uppercase font-bold text-gray-400 tracking-[0.3em] mb-4 px-4">Social Feed Results</h2>
                    <div className="space-y-6">
                        {posts.map(post => <PostRenderer key={post.id} post={post} />)}
                    </div>
                  </section>
               ) : (
                  <div className="text-center py-20 bg-gray-50 dark:bg-gray-900/40 rounded-[2.5rem] mx-2 shadow-inner ring-1 ring-black/5 dark:ring-white/5">
                    <p className="text-xl font-black text-gray-500 dark:text-gray-400 tracking-tight">No content matches "{globalSearch}"</p>
                    <p className="text-sm text-gray-400 mt-2 font-medium">Try searching for #hashtags, @names, or keywords.</p>
                  </div>
               )}
            </div>
         )}
      </div>
    </div>
  );
};

export default SocialHub;
