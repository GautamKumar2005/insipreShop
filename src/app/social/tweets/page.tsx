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

const TweetsPage = () => {
  const [tweets, setTweets] = useState<SocialPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTweets = async () => {
      try {
        const res = await fetch("/api/social");
        const data = await res.json();
        if (data.success) {
          setTweets(data.data.filter((p: SocialPost) => p.type === 'tweet'));
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchTweets();
  }, []);

  return (
    <div className="max-w-2xl mx-auto py-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-10 text-center">
        <h1 className="text-4xl md:text-5xl font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-cyan-400 mb-2">
          Tweets
        </h1>
        <p className="text-gray-500 dark:text-gray-400 font-medium">Join the conversation with short updates.</p>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : tweets.length === 0 ? (
        <div className="text-center py-20 text-gray-400 bg-blue-50/30 dark:bg-blue-900/10 rounded-3xl border border-blue-100 dark:border-blue-900/20 mx-2">
          <p className="text-xl font-bold">No tweets found.</p>
          <p className="mt-2 text-sm text-blue-400">Be the first to share a tweet from your dashboard!</p>
        </div>
      ) : (
        <div className="space-y-6 px-2">
          {tweets.map((tweet) => (
            <Card key={tweet.id} className="p-6 border-none shadow-xl bg-white dark:bg-[#0a0a0a] rounded-[2rem] hover:shadow-2xl transition-all duration-300 ring-1 ring-black/5 dark:ring-white/5">
              <div className="flex gap-4">
                <Link href={`/social/profile/${tweet.user_id}`} className="w-12 h-12 rounded-full overflow-hidden border-2 border-gray-100 dark:border-gray-800 flex-shrink-0 shadow-md">
                   {tweet.user?.avatar ? <img src={tweet.user.avatar} className="w-full h-full object-cover"/> : <div className="w-full h-full flex justify-center items-center bg-blue-100 dark:bg-blue-900/30 text-blue-600 font-bold">{tweet.user?.name?.[0]}</div>}
                </Link>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Link href={`/social/profile/${tweet.user_id}`} className="hover:underline font-bold text-gray-900 dark:text-white truncate">
                      {tweet.user?.name || "User"}
                    </Link>
                    <span className="text-gray-400 text-[10px] font-black uppercase tracking-widest">· {new Date(tweet.created_at).toLocaleDateString()}</span>
                  </div>
                  <div className="text-gray-800 dark:text-gray-200 text-lg leading-relaxed font-medium">
                    <FormattedText text={tweet.content} />
                  </div>
                  
                  <MediaCarousel mediaString={tweet.media_url} type="tweet" />

                  <div className="mt-6 pt-4 border-t border-gray-50 dark:border-gray-900">
                    <PostInteractions 
                      postId={tweet.id}
                      initialLikes={tweet.likes_count || 0}
                      initialComments={tweet.comments_count || 0}
                      initialViews={(tweet.views_count || 0) + 1}
                      isLikedInitially={tweet.liked_by_me || false}
                    />
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default TweetsPage;
