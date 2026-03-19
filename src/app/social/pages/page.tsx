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

const PagesPage = () => {
  const [pages, setPages] = useState<SocialPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPages = async () => {
      try {
        const res = await fetch("/api/social");
        const data = await res.json();
        if (data.success) {
          setPages(data.data.filter((p: SocialPost) => p.type === 'page'));
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchPages();
  }, []);

  return (
    <div className="max-w-4xl mx-auto py-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center mb-10 border-b border-gray-100 dark:border-gray-800 pb-6 px-2">
        <div>
          <h1 className="text-4xl md:text-5xl font-black bg-clip-text text-transparent bg-gradient-to-r from-orange-400 to-yellow-500 mb-2">
            Pages
          </h1>
          <p className="text-gray-500 dark:text-gray-400 font-medium">Discover stories and detailed articles.</p>
        </div>
        <Link href="/social/dashboard">
          <button className="hidden md:flex bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-6 rounded-full items-center gap-2 shadow-lg shadow-orange-500/20 transition-all">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
            Create Page
          </button>
        </Link>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : pages.length === 0 ? (
        <div className="text-center py-20 text-gray-400 bg-orange-50/30 dark:bg-orange-900/10 rounded-3xl border border-orange-100 dark:border-orange-900/20 mx-2">
          <div className="w-24 h-24 mx-auto bg-orange-100 dark:bg-orange-900/30 rounded-3xl flex items-center justify-center mb-6 transform rotate-3 shadow-inner">
             <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-orange-500"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" x2="8" y1="13" y2="13"/><line x1="16" x2="8" y1="17" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
          </div>
          <p className="text-2xl font-black text-gray-800 dark:text-gray-200">No Pages Found</p>
          <p className="mt-2 text-gray-500">Be the first to create and share a comprehensive page.</p>
        </div>
      ) : (
        <div className="space-y-8 px-2">
          {pages.map((page) => (
            <Card key={page.id} className="p-0 border-none shadow-2xl bg-white dark:bg-[#111] rounded-[2.5rem] overflow-hidden group">
              <div className="flex flex-col">
                <div className="p-8">
                  <div className="flex items-center gap-4 mb-6">
                    <Link href={`/social/profile/${page.user_id}`} className="w-12 h-12 rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-800 flex-shrink-0 bg-orange-100 flex items-center justify-center font-black text-orange-600">
                      {page.user?.avatar ? <img src={page.user.avatar} className="w-full h-full object-cover"/> : page.user?.name?.[0] || 'U'}
                    </Link>
                    <div>
                      <Link href={`/social/profile/${page.user_id}`} className="font-bold text-gray-900 dark:text-white hover:underline block">
                        {page.user?.name || "Author"}
                      </Link>
                      <span className="text-xs text-gray-400 font-bold uppercase tracking-widest">{new Date(page.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  
                  <div className="text-gray-800 dark:text-gray-200 text-lg leading-relaxed font-medium mb-6">
                    <FormattedText text={page.content} />
                  </div>

                  <MediaCarousel mediaString={page.media_url} type="page" />
                </div>
                
                <div className="bg-gray-50/50 dark:bg-black/20 border-t border-gray-100 dark:border-gray-800/50 px-8 py-4">
                  <PostInteractions 
                    postId={page.id}
                    initialLikes={page.likes_count || 0}
                    initialComments={page.comments_count || 0}
                    initialViews={(page.views_count || 0) + 1}
                    isLikedInitially={page.liked_by_me || false}
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

export default PagesPage;
