"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { FormattedText } from "./FormattedText";
import Link from "next/link";
import { Card } from "@/components/ui/Card";

interface Comment {
  id: string;
  post_id: string;
  content: string;
  created_at: string;
  user: {
      id: string;
      name: string;
      avatar: string | null;
  };
}

interface ShareUser {
    id: string;
    name: string;
    avatar: string | null;
    username: string;
}

export const PostInteractions = ({ 
  postId, 
  initialLikes, 
  initialComments, 
  initialViews, 
  isLikedInitially 
}: { 
  postId: string; 
  initialLikes: number; 
  initialComments: number; 
  initialViews: number;
  isLikedInitially: boolean;
}) => {
  const { getToken, user } = useAuth();
  const [liked, setLiked] = useState(isLikedInitially);
  const [likesCount, setLikesCount] = useState(initialLikes);
  const [viewsCount, setViewsCount] = useState(initialViews);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState("");
  const [loadingComments, setLoadingComments] = useState(false);
  
  // Sharing
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareUsers, setShareUsers] = useState<ShareUser[]>([]);
  const [sharing, setSharing] = useState<string | null>(null);
  const [sharedStatus, setSharedStatus] = useState<Record<string, boolean>>({});

  // Likes & Views Modals
  const [showLikesModal, setShowLikesModal] = useState(false);
  const [showViewsModal, setShowViewsModal] = useState(false);
  const [interactionUsers, setInteractionUsers] = useState<ShareUser[]>([]);
  const [loadingInteractions, setLoadingInteractions] = useState(false);

  // Record view on mount
  useEffect(() => {
    const recordView = async () => {
        try {
            const token = getToken();
            const res = await fetch("/api/social/view", {
                method: "POST",
                headers: { 
                    "Content-Type": "application/json",
                    ...(token ? { Authorization: `Bearer ${token}` } : {})
                },
                body: JSON.stringify({ postId })
            });
            const data = await res.json();
            if (data.success && data.data.viewsCount !== undefined) {
               setViewsCount(data.data.viewsCount);
            }
        } catch(e) {}
    };
    recordView();
  }, [postId]);

  const handleLike = async () => {
    const token = getToken();
    if (!token) return alert("Please login to like!");
    
    setLiked(!liked);
    setLikesCount(prev => liked ? prev - 1 : prev + 1);

    try {
      const res = await fetch("/api/social/like", {
        method: "POST",
        headers: { 
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ postId })
      });
      const data = await res.json();
      if (data.success) {
          setLiked(data.data.liked);
          if (data.data.likesCount !== undefined) {
             setLikesCount(data.data.likesCount);
          }
      } else {
          // Revert to backup layout if failure
          setLiked(liked);
          setLikesCount(likesCount);
      }
    } catch(err) {
      setLiked(liked);
      setLikesCount(likesCount);
    }
  };

  const fetchComments = async () => {
    if (showComments) {
        setShowComments(false);
        return;
    }
    setShowComments(true);
    setLoadingComments(true);
    try {
      const res = await fetch(`/api/social/comment?postId=${postId}`);
      const data = await res.json();
      if (data.success) {
        setComments(data.data);
      }
    } catch(err) {} finally {
      setLoadingComments(false);
    }
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!commentText.trim()) return;
      const token = getToken();
      if (!token) return alert("Please login to comment!");

      try {
        const res = await fetch("/api/social/comment", {
            method: "POST",
            headers: { 
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}` 
            },
            body: JSON.stringify({ postId, content: commentText })
        });
        const data = await res.json();
        if (data.success) {
            setCommentText("");
            const refreshRes = await fetch(`/api/social/comment?postId=${postId}`);
            const refreshData = await refreshRes.json();
            if (refreshData.success) setComments(refreshData.data);
        }
      } catch(e) {}
  };

  const openLikesModal = async () => {
    setShowLikesModal(true);
    setLoadingInteractions(true);
    try {
        const token = getToken();
        const res = await fetch(`/api/social/like?postId=${postId}`, {
            headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) }
        });
        const data = await res.json();
        if (data.success) {
            setInteractionUsers(data.data);
        }
    } catch(e) {} finally {
        setLoadingInteractions(false);
    }
  };

  const openViewsModal = async () => {
    setShowViewsModal(true);
    setLoadingInteractions(true);
    try {
        const token = getToken();
        const res = await fetch(`/api/social/view?postId=${postId}`, {
            headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) }
        });
        const data = await res.json();
        if (data.success) {
            setInteractionUsers(data.data);
        }
    } catch(e) {} finally {
        setLoadingInteractions(false);
    }
  };

  const openShareModal = async () => {
    setShowShareModal(true);
    try {
        const res = await fetch("/api/users");
        const data = await res.json();
        if (data.success) {
            // In a real app, filter for friends/followers. 
            // Here we show all active users for testing.
            setShareUsers(data.data.filter((u: any) => u._id !== user?.id).map((u: any) => ({
                id: u._id,
                name: u.name,
                avatar: u.profilePhoto?.url || null,
                username: u.username || `user_${u._id.slice(-4)}`
            })));
        }
    } catch(e) {}
  };

  const handleShareToUser = async (targetId: string) => {
    const token = getToken();
    if (!token) return;
    setSharing(targetId);
    try {
        const postUrl = `${window.location.origin}/social/post/${postId}`;
        const res = await fetch("/api/social/messages", {
            method: "POST",
            headers: { 
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}` 
            },
            body: JSON.stringify({
                receiverId: targetId,
                content: `Check out this post: ${postUrl}`
            })
        });
        const data = await res.json();
        if (data.success) {
            setSharedStatus(prev => ({ ...prev, [targetId]: true }));
            setTimeout(() => {
                setSharedStatus(prev => ({ ...prev, [targetId]: false }));
            }, 2000);
        }
    } catch(e) {
    } finally {
        setSharing(null);
    }
  };

  return (
    <div className="space-y-4 pt-2 relative">
      <div className="flex items-center justify-between text-gray-800 dark:text-gray-200">
        <div className="flex items-center gap-4">
            <button 
               onClick={handleLike} 
               className={`transition-all hover:scale-110 active:scale-95 ${liked ? 'text-red-500' : 'hover:text-gray-500'}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill={liked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>
            </button>
            <button 
               onClick={fetchComments}
               className={`transition-all hover:scale-110 active:scale-95 ${showComments ? 'text-blue-500' : 'hover:text-gray-500'}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            </button>
            <button 
              onClick={openShareModal}
              className="hover:scale-110 active:scale-95 hover:text-gray-500 transition-all"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>
            </button>
        </div>
      </div>
      
      {/* Instagram-style metrics row */}
      <div className="flex flex-col gap-0.5 mt-2">
          {likesCount > 0 && (
             <span onClick={openLikesModal} className="text-sm font-semibold cursor-pointer hover:text-gray-500 transition-colors w-fit">
                {likesCount} {likesCount === 1 ? 'like' : 'likes'}
             </span>
          )}
          {initialComments > 0 && !showComments && (
             <span onClick={fetchComments} className="text-sm font-medium text-gray-500 cursor-pointer hover:underline w-fit">
                View all {comments.length > 0 ? comments.length : initialComments} comments
             </span>
          )}
          {viewsCount > 0 && (
             <span onClick={openViewsModal} className="text-xs font-medium text-gray-400 cursor-pointer hover:underline w-fit">
                {viewsCount} {viewsCount === 1 ? 'view' : 'views'}
             </span>
          )}
      </div>

      {showComments && (
        <div className="space-y-4 animate-in slide-in-from-top-2 duration-300 border-t border-gray-100 dark:border-white/5 pt-4">
          <form onSubmit={handleCommentSubmit} className="flex gap-2">
            <input 
              type="text" 
              placeholder="Add a comment..." 
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              className="flex-1 bg-gray-50 dark:bg-white/5 rounded-full px-4 py-2.5 text-sm border-none focus:ring-1 focus:ring-blue-500 font-bold" 
            />
            <button disabled={!commentText.trim()} className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-5 py-2 rounded-full text-xs font-black disabled:opacity-50 transition-transform active:scale-95 shadow-lg">Post</button>
          </form>

          <div className="space-y-4 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
            {loadingComments ? (
              <div className="flex justify-center p-4"><div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div></div>
            ) : comments.length === 0 ? (
              <p className="text-xs text-center text-gray-400 py-2 font-bold opacity-50">No comments yet. Be the first!</p>
            ) : (
                comments.map(c => (
                    <div key={c.id} className="flex gap-3 items-start animate-in fade-in duration-500">
                         <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-white/5 overflow-hidden flex-shrink-0 flex items-center justify-center font-bold text-xs text-gray-600 border border-white dark:border-gray-800 shadow-sm">
                            {c.user.avatar ? <img src={c.user.avatar} className="w-full h-full object-cover" /> : c.user.name?.[0]}
                         </div>
                         <div className="bg-gray-100/50 dark:bg-white/5 rounded-[1.25rem] p-3 flex-1 ring-1 ring-black/5 dark:ring-white/5">
                            <div className="flex justify-between items-center mb-1">
                                <span className="font-black text-xs tracking-tight">{c.user.name}</span>
                                <span className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">{new Date(c.created_at).toLocaleDateString()}</span>
                            </div>
                            <div className="text-sm text-gray-700 dark:text-gray-300 font-medium">
                                <FormattedText text={c.content} />
                            </div>
                         </div>
                    </div>
                ))
            )}
          </div>
        </div>
      )}

      {/* Share Modal Overlay */}
      {showShareModal && (
        <>
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] animate-in fade-in duration-300" onClick={() => setShowShareModal(false)}></div>
            <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-md bg-white dark:bg-[#0a0a0a] rounded-[2.5rem] shadow-2xl z-[101] overflow-hidden animate-in zoom-in-95 duration-300 border border-white/10">
                <div className="p-6 border-b border-gray-100 dark:border-white/5 flex items-center justify-between bg-gray-50/50 dark:bg-white/5">
                    <h3 className="text-xl font-black tracking-tighter">Share to Chat</h3>
                    <button onClick={() => setShowShareModal(false)} className="p-2 hover:bg-white dark:hover:bg-white/10 rounded-full transition-all">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                    </button>
                </div>
                <div className="p-4 max-h-[400px] overflow-y-auto custom-scrollbar">
                    <div className="text-[10px] font-black uppercase text-gray-400 tracking-widest px-2 mb-4">Select recipient</div>
                    {shareUsers.length === 0 ? (
                        <div className="p-10 text-center text-sm text-gray-400 font-bold opacity-30">No active users to share with.</div>
                    ) : (
                        <div className="grid gap-2">
                        {shareUsers.map(u => (
                            <div key={u.id} className="flex items-center justify-between p-3 rounded-2xl hover:bg-gray-50 dark:hover:bg-white/5 transition-all group">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full border border-gray-100 dark:border-white/10 overflow-hidden bg-gray-50 dark:bg-gray-800 flex items-center justify-center font-black shadow-sm group-hover:scale-110 transition-transform">
                                        {u.avatar ? <img src={u.avatar} className="w-full h-full object-cover" /> : u.name[0]}
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="font-bold text-sm tracking-tight">{u.name}</span>
                                        <span className="text-[10px] text-gray-400 font-black uppercase tracking-widest opacity-60">@{u.username}</span>
                                    </div>
                                </div>
                                <button 
                                  onClick={() => handleShareToUser(u.id)}
                                  disabled={sharing === u.id || sharedStatus[u.id]}
                                  className={`px-5 py-2 rounded-full text-xs font-black transition-all active:scale-95 shadow-lg ${
                                      sharedStatus[u.id] 
                                        ? 'bg-green-500 text-white shadow-green-500/20' 
                                        : 'bg-blue-500 text-white hover:bg-blue-600 shadow-blue-500/20 disabled:opacity-50'
                                  }`}
                                >
                                    {sharing === u.id ? 'Sending...' : sharedStatus[u.id] ? 'Sent!' : 'Send'}
                                </button>
                            </div>
                        ))}
                        </div>
                    )}
                </div>
            </div>
        </>
      )}

      {/* Interactions Modal Overlay (Likes & Views) */}
      {(showLikesModal || showViewsModal) && (
        <>
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] animate-in fade-in duration-300" onClick={() => { setShowLikesModal(false); setShowViewsModal(false); }}></div>
            <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-sm bg-white dark:bg-[#0a0a0a] rounded-[2.5rem] shadow-2xl z-[101] overflow-hidden animate-in zoom-in-95 duration-300 border border-white/10">
                <div className="p-6 border-b border-gray-100 dark:border-white/5 flex items-center justify-between bg-gray-50/50 dark:bg-white/5">
                    <h3 className="text-xl font-black tracking-tighter capitalize">{showLikesModal ? 'Likes' : 'Views'}</h3>
                    <button onClick={() => { setShowLikesModal(false); setShowViewsModal(false); }} className="p-2 hover:bg-white dark:hover:bg-white/10 rounded-full transition-all">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                    </button>
                </div>
                <div className="p-4 max-h-[350px] overflow-y-auto custom-scrollbar">
                    {loadingInteractions ? (
                        <div className="flex justify-center p-8"><div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div></div>
                    ) : interactionUsers.length === 0 ? (
                        <div className="p-10 text-center text-sm text-gray-400 font-bold opacity-50">No {showLikesModal ? 'likes' : 'views'} yet.</div>
                    ) : (
                        <div className="grid gap-2">
                            {interactionUsers.map(u => (
                                <Link key={u.id} href={`/social/profile/${u.id}`} className="flex items-center gap-3 p-3 rounded-2xl hover:bg-gray-50 dark:hover:bg-white/5 transition-all group">
                                    <div className="w-10 h-10 rounded-full border border-gray-100 dark:border-white/10 overflow-hidden bg-gray-50 dark:bg-gray-800 flex items-center justify-center font-black shadow-sm group-hover:scale-110 transition-transform">
                                        {u.avatar ? <img src={u.avatar} className="w-full h-full object-cover" /> : u.name[0]}
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="font-bold text-sm tracking-tight">{u.name}</span>
                                        <span className="text-[10px] text-gray-400 font-black uppercase tracking-widest opacity-60">@{u.username}</span>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </>
      )}

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar { width: 3px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.1); border-radius: 10px; }
      `}</style>
    </div>
  );
};
