"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useParams, useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { MediaCarousel } from "@/components/social/MediaCarousel";
import { PostInteractions } from "@/components/social/PostInteractions";
import { FormattedText } from "@/components/social/FormattedText";
import Link from "next/link";

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

const SinglePostPage = () => {
  const { id } = useParams() as { id: string };
  const { user } = useAuth();
  const router = useRouter();
  const [post, setPost] = useState<SocialPost | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const res = await fetch(`/api/social/${id}`);
        const data = await res.json();
        if (data.success) {
          setPost(data.data);
          // Increment views
          fetch(`/api/social/view`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ postId: id, userId: user?.id || 'anonymous' })
          });
        }
      } catch (err) {
              } finally {
        setLoading(false);
      }
    };
    if (id) fetchPost();
  }, [id, user]);

  if (loading) return <div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div></div>;
  if (!post) return <div className="text-center py-20 font-bold text-gray-500">Post not found</div>;

  return (
    <div className="max-w-2xl mx-auto py-10 px-4">
      <button onClick={() => router.back()} className="mb-6 flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-gray-900 transition-all">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m15 18-6-6 6-6"/></svg>
        Back
      </button>

      <Card className="p-6 border-none shadow-2xl bg-white dark:bg-[#111] rounded-[2.5rem]">
        <div className="flex gap-4">
          <Link href={`/social/profile/${post.user_id}`}>
            <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white dark:border-gray-800 shadow-sm transition-transform active:scale-90 flex-shrink-0 bg-purple-100 flex items-center justify-center font-bold text-purple-600">
              {post.user?.avatar ? <img src={post.user.avatar} className="w-full h-full object-cover"/> : post.user?.name?.[0]}
            </div>
          </Link>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-4">
              <div className="flex flex-col">
                <Link href={`/social/profile/${post.user_id}`} className="hover:underline font-black text-lg text-gray-900 dark:text-gray-100 truncate">
                  {post.user?.name || "User"}
                </Link>
                <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-tighter w-fit ${
                        post.type === 'reel' ? 'bg-pink-100 text-pink-600' : 
                        post.type === 'tweet' ? 'bg-blue-100 text-blue-600' : 
                        'bg-purple-100 text-purple-600'
                    }`}>
                        {post.type}
                    </span>
                    <span className="text-[10px] text-gray-300 font-bold uppercase tracking-widest">
                        {new Date(post.created_at).toLocaleDateString()}
                    </span>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="text-xl text-gray-700 dark:text-gray-300 leading-relaxed font-bold mb-6">
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
    </div>
  );
};

export default SinglePostPage;
