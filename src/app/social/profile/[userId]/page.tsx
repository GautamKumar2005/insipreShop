"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/Card";
import Link from "next/link";
import { useParams } from "next/navigation";
import { MediaCarousel } from "@/components/social/MediaCarousel";
import { PostInteractions } from "@/components/social/PostInteractions";
import { FormattedText } from "@/components/social/FormattedText";

interface SocialPost {
  id: string;
  user_id: string;
  content: string;
  type: 'page' | 'reel' | 'tweet';
  media_url?: string;
  created_at: string;
  likes_count?: number;
  comments_count?: number;
  views_count?: number;
  liked_by_me?: boolean;
}

interface UserInfo {
  name: string;
  avatar: string | null;
  role: string;
}

const SocialProfile = () => {
  const params = useParams();
  const userId = params?.userId as string;
  const { user: currentUser } = useAuth();
  
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [profileUser, setProfileUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Connection states
  const [connectStatus, setConnectStatus] = useState<string>("none"); // "none" | "pending" | "accepted"
  const [connectSenderId, setConnectSenderId] = useState<string>("");
  const [connectionsCount, setConnectionsCount] = useState<number>(0);

  const fetchProfileData = async () => {
    try {
      setLoading(true);
      const token = window.localStorage.getItem('token');
      const fetchOpts = { headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) } };
      const [socialRes, userRes, statsRes] = await Promise.all([
        fetch(`/api/social?userId=${userId}`, fetchOpts),
        fetch(`/api/users/${userId}`),
        fetch(`/api/social/stats?userId=${userId}`)
      ]);
      
      const socialData = await socialRes.json();
      const userData = await userRes.json();
      const statsData = await statsRes.json();
      
      if (socialData.success) {
        setPosts(socialData.data);
      }

      if (statsData.success) {
        setConnectionsCount(statsData.data.connections);
      }

      if (userData.success && userData.data) {
        setProfileUser({
          name: userData.data.name,
          avatar: userData.data.profilePhoto?.url || null,
          role: userData.data.role || "Social Member"
        });
      } else if (socialData.success && socialData.data?.length > 0 && socialData.data[0].user) {
        setProfileUser({
          name: socialData.data[0].user.name,
          avatar: socialData.data[0].user.avatar,
          role: "Social Member"
        });
      }

      if (currentUser) {
        const connRes = await fetch(`/api/social/connections?userId=${currentUser.id}&type=status&targetUserId=${userId}`, fetchOpts);
        const connData = await connRes.json();
        if (connData.success) {
          setConnectStatus(connData.data.status);
          setConnectSenderId(connData.data.sender_id);
        }
      }
    } catch (err) {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) fetchProfileData();
  }, [userId, currentUser]);

  const handleConnectAction = async (action: 'request' | 'accept' | 'decline' | 'disconnect') => {
    if (!currentUser) return alert("Please login to connect!");
    try {
      const res = await fetch("/api/social/connections", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${window.localStorage.getItem('token') || ''}`
        },
        body: JSON.stringify({ targetUserId: userId, action })
      });
      const data = await res.json();
      if (data.success) {
        setConnectStatus(data.data.status || "none");
        setConnectSenderId(data.data.sender_id || "");
        fetchProfileData();
      } else {
        alert(data.message || "Action failed");
      }
    } catch (err) {
      alert("Error processing connection request");
    }
  };

  const [showConnectionsModal, setShowConnectionsModal] = useState<boolean>(false);
  const [connectionsList, setConnectionsList] = useState<any[]>([]);

  const fetchConnections = async () => {
    try {
      setConnectionsList([]);
      setShowConnectionsModal(true);
      const token = window.localStorage.getItem('token');
      const fetchOpts = { headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) } };
      const res = await fetch(`/api/social/connections?userId=${userId}&type=accepted`, fetchOpts);
      const data = await res.json();
      if (data.success) {
        setConnectionsList(data.data);
      }
    } catch (e) {}
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!profileUser && posts.length === 0) {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center">
          <h2 className="text-2xl font-bold mb-2">User not found</h2>
          <p className="text-gray-500 mb-6">This user hasn't shared anything on the Social Hub yet.</p>
          <Link href="/social">
            <button className="px-6 py-2 bg-purple-600 text-white rounded-full">Back to Feed</button>
          </Link>
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-[#050505] text-gray-900 dark:text-gray-100 relative">
      {/* Modal for Connections */}
      {showConnectionsModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white dark:bg-gray-900 rounded-3xl w-full max-w-sm max-h-[70vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between sticky top-0 bg-white dark:bg-gray-900 z-10">
              <h3 className="font-bold text-lg">Connections</h3>
              <button onClick={() => setShowConnectionsModal(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {connectionsList.length === 0 ? (
                <p className="text-center text-gray-500 py-10 font-medium">No connections found.</p>
              ) : (
                connectionsList.map(item => (
                  <div key={item.id} className="flex items-center justify-between p-2 hover:bg-gray-50 dark:hover:bg-white/5 rounded-2xl transition-all">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900 overflow-hidden flex items-center justify-center text-purple-600 font-bold border border-gray-100 dark:border-gray-800 shadow-sm">
                        {item.user?.avatar ? <img src={item.user.avatar} alt={item.user.name} className="w-full h-full object-cover"/> : item.user?.name?.[0]}
                      </div>
                      <div className="flex flex-col">
                         <Link onClick={() => setShowConnectionsModal(false)} href={`/social/profile/${item.user?._id}`} className="font-bold text-sm hover:underline">{item.user?.name}</Link>
                         <span className="text-[10px] text-gray-400 font-black uppercase tracking-widest opacity-60">@{item.user?.username}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Cover Profile Header */}
      <div className="h-48 bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400"></div>
      
      <div className="container mx-auto px-4 max-w-2xl -mt-20">
        <div className="flex flex-col items-center mb-8">
          <div className="w-32 h-32 rounded-full border-4 border-white dark:border-gray-900 shadow-2xl overflow-hidden bg-white mb-4">
             {profileUser?.avatar ? (
                <img src={profileUser.avatar} alt={profileUser.name} className="w-full h-full object-cover" />
             ) : (
                <div className="w-full h-full flex items-center justify-center bg-purple-100 text-purple-600 text-4xl font-bold">
                    {profileUser?.name?.[0] || 'U'}
                </div>
             )}
          </div>
          <h1 className="text-3xl font-black tracking-tight mb-1">{profileUser?.name || "Member"}</h1>
          <p className="text-gray-500 font-medium lowercase">@user_{userId.slice(-6)}</p>
          
          {currentUser && currentUser.id !== userId && (
            <div className="flex gap-4 mt-6 w-full">
              {connectStatus === "none" && (
                <button 
                  onClick={() => handleConnectAction('request')}
                  className="flex-1 py-3 bg-gray-900 dark:bg-white dark:text-gray-900 text-white rounded-2xl font-bold transition-transform active:scale-95 border-2 border-transparent"
                >
                  Connect
                </button>
              )}
              {connectStatus === "pending" && connectSenderId === currentUser.id && (
                <button 
                  onClick={() => handleConnectAction('decline')}
                  className="flex-1 py-3 bg-gray-200 dark:bg-gray-800 text-gray-500 dark:text-gray-400 rounded-2xl font-bold transition-transform active:scale-95 border-2 border-gray-300 dark:border-gray-700"
                >
                  Requested (Cancel)
                </button>
              )}
              {connectStatus === "pending" && connectSenderId !== currentUser.id && (
                <button 
                  onClick={() => handleConnectAction('accept')}
                  className="flex-1 py-3 bg-purple-600 text-white rounded-2xl font-bold transition-transform active:scale-95 border-2 border-transparent"
                >
                  Accept Request
                </button>
              )}
              {connectStatus === "accepted" && (
                <button 
                  onClick={() => handleConnectAction('disconnect')}
                  className="flex-1 py-3 bg-gray-100 dark:bg-gray-800 text-red-600 rounded-2xl font-bold transition-transform active:scale-95 border-2 border-red-500/20"
                >
                  Disconnect
                </button>
              )}
              
              <Link href={`/social/inbox?user=${userId}`} className="px-6 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl font-bold transition-transform active:scale-95 flex items-center justify-center">
                  Message
              </Link>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-10 py-4 border-y border-gray-100 dark:border-gray-800">
            <div className="text-center">
                <div className="font-black text-xl">{posts.length}</div>
                <div className="text-[10px] uppercase font-black text-gray-400 tracking-widest">Posts</div>
            </div>
            <div className="text-center cursor-pointer hover:opacity-75 transition-opacity" onClick={fetchConnections}>
                <div className="font-black text-xl">{connectionsCount}</div>
                <div className="text-[10px] uppercase font-black text-gray-400 tracking-widest">Connections</div>
            </div>
        </div>

        {/* User Posts */}
        <div className="space-y-6">
            <h2 className="text-xl font-black mb-4 px-2">Recent Activity</h2>
            {posts.map((post) => (
              <Card key={post.id} className="p-6 border-none shadow-lg bg-white dark:bg-[#111] rounded-3xl transition-all">
                <div className="flex gap-4">
                   <div className="flex-1 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-tighter ${
                        post.type === 'reel' ? 'bg-pink-100 text-pink-600' : 
                        post.type === 'tweet' ? 'bg-blue-100 text-blue-600' : 
                        'bg-purple-100 text-purple-600'
                      }`}>
                        {post.type}
                      </span>
                      <span className="text-[10px] text-gray-400 uppercase font-black tracking-widest">
                        {new Date(post.created_at).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="text-gray-800 dark:text-gray-200 leading-relaxed font-medium">
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
              </Card>
            ))}
        </div>
      </div>
    </div>
  );
};

export default SocialProfile;
