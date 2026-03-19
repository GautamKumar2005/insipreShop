"use client";

import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/Card";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
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

const ReelsPage = () => {
  const [reels, setReels] = useState<SocialPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReels = async () => {
      try {
        const res = await fetch("/api/social");
        const data = await res.json();
        if (data.success) {
          setReels(data.data.filter((p: SocialPost) => p.type === 'reel'));
        }
      } catch (err) {
              } finally {
        setLoading(false);
      }
    };
    fetchReels();
  }, []);

  return (
    <div className="max-w-4xl mx-auto py-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-12 text-center">
        <h1 className="text-5xl md:text-6xl font-black bg-clip-text text-transparent bg-gradient-to-r from-pink-500 via-purple-500 to-orange-400 mb-4 tracking-tighter">
          Reels
        </h1>
        <p className="text-gray-500 dark:text-gray-400 font-bold uppercase tracking-widest text-xs">Entertainment • Clips • Stories</p>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="w-12 h-12 border-4 border-pink-500 border-t-transparent rounded-full animate-spin shadow-lg shadow-pink-500/20" />
        </div>
      ) : reels.length === 0 ? (
        <div className="text-center py-20 opacity-50 bg-gray-50 dark:bg-gray-900/50 rounded-3xl mx-2 border border-dashed border-gray-200 dark:border-gray-800">
           <svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-4 text-pink-500"><path d="m22 8-6 4 6 4V8Z"/><rect width="14" height="12" x="2" y="6" rx="2" ry="2"/></svg>
           <p className="text-2xl font-black">No reels yet</p>
           <p className="max-w-xs mx-auto mt-2">Check back later or share your first reel from your dashboard!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 px-2 pb-20 mt-10">
          {reels.map((reel) => (
            <Card key={reel.id} className="overflow-hidden border-none shadow-2xl bg-[#080808] text-white rounded-[3rem] group relative h-[700px] ring-1 ring-white/10 flex flex-col transition-all active:scale-95 duration-500 cursor-pointer">
              
              {/* Media Section (Video) */}
              <div className="flex-1 overflow-hidden relative">
                 <MediaCarousel mediaString={reel.media_url} type="reel" />
                 
                 {/* Top Controls Overlay */}
                 <div className="absolute top-0 left-0 right-0 p-8 flex justify-between items-start bg-gradient-to-b from-black/60 to-transparent pointer-events-none">
                    <div className="flex items-center gap-3">
                       <Link href={`/social/profile/${reel.user_id}`}  className="pointer-events-auto">
                         <div className="w-10 h-10 rounded-2xl overflow-hidden border-2 border-white/20 shadow-xl bg-purple-500/20 backdrop-blur-md flex items-center justify-center font-black text-white">
                           {reel.user?.avatar ? <img src={reel.user.avatar} className="w-full h-full object-cover"/> : reel.user?.name?.[0]}
                         </div>
                       </Link>
                       <Link href={`/social/profile/${reel.user_id}`} className="pointer-events-auto font-black text-sm drop-shadow-md hover:underline">
                         {reel.user?.name || "User"}
                       </Link>
                    </div>
                    <button className="p-3 bg-white/10 hover:bg-white/20 backdrop-blur-xl rounded-2xl pointer-events-auto transition-all">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>
                    </button>
                 </div>
              </div>

              {/* Bottom Content & Interaction Overlay */}
              <div className="bg-gradient-to-t from-black via-black/80 to-transparent p-8 pt-0 space-y-4">
                 <div className="text-white/90 text-sm font-medium leading-relaxed max-w-[85%] mb-4">
                    <FormattedText text={reel.content} />
                 </div>
                 
                 <div className="border-t border-white/5 pt-4 backdrop-blur-3xl rounded-3xl">
                   <PostInteractions 
                     postId={reel.id}
                     initialLikes={reel.likes_count || 0}
                     initialComments={reel.comments_count || 0}
                     initialViews={(reel.views_count || 0) + 1}
                     isLikedInitially={reel.liked_by_me || false}
                   />
                 </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default ReelsPage;
