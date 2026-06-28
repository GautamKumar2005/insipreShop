"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import Link from "next/link";
import { CldUploadWidget } from "next-cloudinary";
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

const SocialDashboard = () => {
  const { user, getToken } = useAuth();
  const [content, setContent] = useState("");
  const [type, setType] = useState<'page' | 'reel' | 'tweet'>('page');
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'my_content' | 'settings'>('my_content');
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [stats, setStats] = useState({ connections: 0, pendingRequests: 0, posts: 0 });
  const [profileData, setProfileData] = useState({ name: "", username: "", bio: "" });

  const fetchMyPosts = async () => {
    if (!user) return;
    try {
      const res = await fetch(`/api/social?userId=${user.id}`);
      const data = await res.json();
      if (data.success) {
        setPosts(data.data);
      }
    } catch (err) {
    }
  };

  const fetchStats = async () => {
    if (!user) return;
    try {
      const res = await fetch(`/api/social/stats?userId=${user.id}`);
      const data = await res.json();
      if (data.success) {
        setStats(data.data);
      }
    } catch (err) {
    }
  };

  const fetchProfile = async () => {
    if (!user) return;
    try {
      const res = await fetch(`/api/users/${user.id}`);
      const data = await res.json();
      if (data.success) {
        setProfileData({
           name: data.data.name || user.name,
           username: data.data.username || `user_${user.id.slice(-6)}`,
           bio: data.data.bio || ""
        });
      }
    } catch (err) {
    }
  };

  const [showConnectionModal, setShowConnectionModal] = useState<'connections' | 'pending' | null>(null);
  const [connectionList, setConnectionList] = useState<any[]>([]);

  const fetchConnectionList = async (type: 'connections' | 'pending') => {
    if (!user) return;
    try {
      setConnectionList([]);
      setShowConnectionModal(type);
      const token = getToken();
      const res = await fetch(`/api/social/connections?userId=${user.id}&type=${type}`, {
        headers: {
          Authorization: `Bearer ${token || ""}`
        }
      });
      const data = await res.json();
      if (data.success) {
        setConnectionList(data.data);
      }
    } catch (err) {
    }
  };

  const handleConnectionAction = async (targetUserId: string, action: 'accept' | 'decline' | 'disconnect') => {
    const token = getToken();
    if (!token) return;
    try {
      const res = await fetch("/api/social/connections", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ targetUserId, action })
      });
      const data = await res.json();
      if (data.success) {
        if (showConnectionModal) {
          fetchConnectionList(showConnectionModal);
        }
        fetchStats();
      } else {
        alert(data.message || "Action failed");
      }
    } catch (err) {
      alert("Error processing connection request");
    }
  };

  useEffect(() => {
    if (user) {
        fetchMyPosts();
        fetchStats();
        fetchProfile();
    }
  }, [user]);

  const handleShare = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    const token = getToken();
    if (!token) return;

    setLoading(true);
    try {
      const res = await fetch("/api/social", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content, type, media_urls: mediaUrls }),
      });

      const data = await res.json();
      if (data.success) {
        setContent("");
        setMediaUrls([]);
        alert("Shared successfully!");
        fetchMyPosts();
        fetchStats();
      } else {
        alert(data.message || "Failed to share");
      }
    } catch (err) {
      alert("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const [editingPost, setEditingPost] = useState<SocialPost | null>(null);
  const [editContent, setEditContent] = useState("");

  const handleDelete = async (postId: string) => {
    if (!confirm("Are you sure you want to delete this post?")) return;
    const token = getToken();
    if (!token) return;
    try {
      const res = await fetch(`/api/social/${postId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setPosts(posts.filter(p => p.id !== postId));
        fetchStats();
      } else {
        alert(data.message || "Failed to delete.");
      }
    } catch (err) {
      alert("Error deleting post.");
    }
  };

  const handleEditSubmit = async (postId: string) => {
    if (!editContent.trim()) return;
    const token = getToken();
    if (!token) return;
    try {
      const res = await fetch(`/api/social/${postId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ content: editContent })
      });
      const data = await res.json();
      if (data.success) {
        setPosts(posts.map(p => p.id === postId ? { ...p, content: editContent } : p));
        setEditingPost(null);
      } else {
        alert(data.message || "Failed to edit.");
      }
    } catch (err) {
      alert("Error updating post.");
    }
  };

  const [saveProfileLoading, setSaveProfileLoading] = useState(false);
  const handleProfileUpdate = async () => {
      if (!profileData.name.trim()) return alert("Name is required");
      const token = getToken();
      if (!token) return;

      setSaveProfileLoading(true);
      try {
          const res = await fetch(`/api/users/${user?.id}`, {
              method: "PUT",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`
              },
              body: JSON.stringify({ 
                  name: profileData.name,
                  username: profileData.username,
                  bio: profileData.bio
              })
          });
          const data = await res.json();
          if (data.success) {
              alert("Profile updated successfully!");
              window.location.reload(); // Refresh to update user context
          } else {
              alert(data.message || "Update failed.");
          }
      } catch (err) {
          alert("Error updating profile.");
      } finally {
          setSaveProfileLoading(false);
      }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[70vh] px-4">
        <Card className="max-w-md w-full p-10 text-center border-none shadow-2xl bg-white dark:bg-gray-900 rounded-[2.5rem] ring-1 ring-black/5 dark:ring-white/10 animate-in fade-in zoom-in duration-500">
          <div className="w-20 h-20 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-6 text-purple-600">
             <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          </div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white mb-4 tracking-tighter">Your ADS Dashboard</h1>
          <p className="text-gray-500 dark:text-gray-400 mb-8 font-medium">Join our community to share stories, connect with creators, and build your own social feed.</p>
          
          <div className="grid gap-3">
             <Link href="/auth/login">
               <Button className="w-full py-6 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-lg shadow-xl shadow-purple-500/20">
                 Login to Your Space
               </Button>
             </Link>
             <Link href="/auth/register">
               <Button variant="outline" className="w-full py-6 rounded-2xl font-bold text-lg border-purple-100 dark:border-gray-800 text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/10">
                 Create New Account
               </Button>
             </Link>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Modal for Connections/Pending Requests */}
      {showConnectionModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white dark:bg-gray-900 rounded-3xl w-full max-w-md max-h-[70vh] flex flex-col overflow-hidden shadow-2xl border border-gray-100 dark:border-gray-800">
            <div className="p-5 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between sticky top-0 bg-white dark:bg-gray-900 z-10">
              <h3 className="font-black text-xl tracking-tight capitalize">
                {showConnectionModal === 'connections' ? 'My Connections' : 'Connection Requests'}
              </h3>
              <button onClick={() => setShowConnectionModal(null)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-all">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {connectionList.length === 0 ? (
                <p className="text-center text-gray-500 py-10 font-bold opacity-50">
                  {showConnectionModal === 'connections' ? 'No connections yet.' : 'No pending requests.'}
                </p>
              ) : (
                connectionList.map(item => (
                  <div key={item.id} className="flex items-center justify-between p-2 rounded-2xl hover:bg-gray-50 dark:hover:bg-white/5 transition-all">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-full bg-purple-100 dark:bg-purple-900 overflow-hidden flex items-center justify-center text-purple-600 font-bold border border-gray-100 dark:border-gray-800 shadow-sm">
                        {item.user?.avatar ? <img src={item.user.avatar} alt={item.user.name} className="w-full h-full object-cover"/> : item.user?.name?.[0]}
                      </div>
                      <div>
                        <Link onClick={() => setShowConnectionModal(null)} href={`/social/profile/${item.user?._id}`} className="font-bold text-sm hover:underline hover:text-purple-600 block">{item.user?.name}</Link>
                        <span className="text-[10px] text-gray-400 font-black uppercase tracking-wider">@{item.user?.username}</span>
                      </div>
                    </div>
                    {showConnectionModal === 'pending' ? (
                      <div className="flex gap-2">
                        <button 
                          onClick={() => handleConnectionAction(item.user?._id, 'accept')}
                          className="bg-purple-600 text-white font-bold text-xs px-4 py-2 rounded-full hover:bg-purple-700 active:scale-95 transition-all shadow-md shadow-purple-500/10"
                        >
                          Accept
                        </button>
                        <button 
                          onClick={() => handleConnectionAction(item.user?._id, 'decline')}
                          className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-bold text-xs px-4 py-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 active:scale-95 transition-all"
                        >
                          Decline
                        </button>
                      </div>
                    ) : (
                      <button 
                        onClick={() => handleConnectionAction(item.user?._id, 'disconnect')}
                        className="bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 font-bold text-xs px-4 py-2 rounded-full hover:bg-red-100 dark:hover:bg-red-900/20 active:scale-95 transition-all"
                      >
                        Disconnect
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Compact Profile Card */}
      <div className="bg-white dark:bg-[#0d0d0d] rounded-2xl sm:rounded-3xl border border-gray-100 dark:border-gray-900/80 shadow-sm overflow-hidden mb-4">
        {/* Gradient top strip */}
        <div className="h-14 sm:h-16 bg-gradient-to-r from-purple-600/20 via-indigo-500/10 to-pink-500/20" />
        <div className="px-4 sm:px-5 pb-4 sm:pb-5 -mt-7">
          <div className="flex items-end gap-3 sm:gap-4 mb-3">
            {/* Avatar */}
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl overflow-hidden border-2 border-white dark:border-[#0d0d0d] shadow-md bg-gradient-to-tr from-purple-100 to-pink-100 dark:from-purple-900/40 dark:to-pink-900/40 flex items-center justify-center text-lg font-black text-purple-600 shrink-0">
              {user.avatar ? <img src={user.avatar} className="w-full h-full object-cover" alt="" /> : user.name?.[0].toUpperCase()}
            </div>
            {/* Name + handle */}
            <div className="flex-1 min-w-0 pb-1">
              <h1 className="text-base sm:text-lg font-extrabold text-gray-900 dark:text-white truncate leading-tight">
                {profileData.name || user.name}
              </h1>
              <span className="text-[11px] font-bold text-purple-500">
                @{profileData.username || `user_${user.id.slice(-6)}`}
              </span>
            </div>
          </div>

          {/* Bio */}
          {profileData.bio && (
            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-3 leading-relaxed">
              {profileData.bio}
            </p>
          )}

          {/* Stats row */}
          <div className="flex items-center gap-5">
            <button
              onClick={() => fetchConnectionList('connections')}
              className="flex flex-col items-center text-center hover:opacity-70 transition-opacity group"
            >
              <span className="text-lg font-extrabold text-gray-900 dark:text-white group-hover:text-purple-600 transition-colors">{stats.connections}</span>
              <span className="text-[10px] font-black uppercase tracking-wider text-gray-400">Connects</span>
            </button>
            <div className="w-px h-6 bg-gray-100 dark:bg-gray-900" />
            <button
              onClick={() => fetchConnectionList('pending')}
              className="flex flex-col items-center text-center hover:opacity-70 transition-opacity group"
            >
              <span className="text-lg font-extrabold text-gray-900 dark:text-white group-hover:text-purple-600 transition-colors">{stats.pendingRequests}</span>
              <span className="text-[10px] font-black uppercase tracking-wider text-gray-400">Requests</span>
            </button>
            <div className="w-px h-6 bg-gray-100 dark:bg-gray-900" />
            <div className="flex flex-col items-center text-center">
              <span className="text-lg font-extrabold text-gray-900 dark:text-white">{stats.posts}</span>
              <span className="text-[10px] font-black uppercase tracking-wider text-gray-400">Posts</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex bg-gray-100 dark:bg-[#111] p-1 rounded-2xl gap-1 mb-4">
        <button
          onClick={() => setActiveTab('my_content')}
          className={`flex-1 py-2.5 px-4 rounded-xl text-[11px] font-extrabold uppercase tracking-wider transition-all ${
            activeTab === 'my_content'
              ? 'bg-white dark:bg-[#1a1a1a] text-purple-600 shadow-sm'
              : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
          }`}
        >
          My Content
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`flex-1 py-2.5 px-4 rounded-xl text-[11px] font-extrabold uppercase tracking-wider transition-all ${
            activeTab === 'settings'
              ? 'bg-white dark:bg-[#1a1a1a] text-purple-600 shadow-sm'
              : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
          }`}
        >
          Settings
        </button>
      </div>



      {activeTab === 'settings' && (
        <Card className="p-8 border-none shadow-2xl bg-white/70 dark:bg-gray-900/70 backdrop-blur-2xl rounded-3xl ring-1 ring-black/5 dark:ring-white/5">
          <h2 className="text-2xl font-bold mb-6">Profile Settings</h2>
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="font-bold text-gray-700 dark:text-gray-300">Full Name</label>
              <input 
                type="text" 
                value={profileData.name} 
                onChange={(e) => setProfileData({...profileData, name: e.target.value})}
                className="w-full p-4 rounded-xl bg-gray-50 dark:bg-gray-800 border-none focus:ring-2 focus:ring-purple-500" 
              />
            </div>
            <div className="space-y-2">
              <label className="font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                Username 
                <span className="text-[10px] font-black uppercase text-purple-500 tracking-widest">(Must be unique)</span>
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">@</span>
                <input 
                  type="text" 
                  value={profileData.username} 
                  onChange={(e) => setProfileData({...profileData, username: e.target.value})}
                  className="w-full p-4 pl-9 rounded-xl bg-gray-50 dark:bg-gray-800 border-none focus:ring-2 focus:ring-purple-500 font-bold" 
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="font-bold text-gray-700 dark:text-gray-300">Bio</label>
              <textarea 
                placeholder="Tell us about yourself..." 
                value={profileData.bio}
                onChange={(e) => setProfileData({...profileData, bio: e.target.value})}
                className="w-full p-4 rounded-xl bg-gray-50 dark:bg-gray-800 border-none focus:ring-2 focus:ring-purple-500 resize-none h-24" 
              />
            </div>
            <div className="pt-4 flex justify-end">
              <Button 
                onClick={handleProfileUpdate}
                disabled={saveProfileLoading}
                className="bg-purple-600 text-white font-bold py-3 px-8 rounded-full shadow-lg shadow-purple-500/20 active:scale-95 transition-all"
              >
                {saveProfileLoading ? "Saving..." : "Save Profile Details"}
              </Button>
            </div>
          </div>
        </Card>
      )}

      {activeTab === 'my_content' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
          <h2 className="text-2xl font-bold mb-4 px-2">Your Published Content ({posts.length})</h2>
          {posts.length === 0 ? (
            <div className="py-20 text-center opacity-50 bg-gray-50 dark:bg-gray-900/50 rounded-3xl">
               <p className="text-xl font-bold mb-2">No content yet</p>
               <p>Head to the Create Content tab to share your first post!</p>
            </div>
          ) : (
            posts.map(post => (
              <Card key={post.id} className="p-6 border-none shadow-lg bg-white dark:bg-[#111] rounded-3xl group transition-all">
                <div className="flex gap-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full overflow-hidden border border-gray-100 dark:border-gray-800 flex-shrink-0 bg-purple-100 flex items-center justify-center font-bold text-purple-600">
                     {user?.avatar ? <img src={user.avatar} className="w-full h-full object-cover"/> : user?.name?.[0]}
                  </div>
                  <div className="flex-1 space-y-2 sm:space-y-3 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <span className="font-bold text-sm truncate">@{profileData.username || user?.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-tighter bg-gray-100 dark:bg-gray-800 text-gray-500">{post.type}</span>
                        <span className="text-[10px] text-gray-300 dark:text-gray-700 uppercase font-black tracking-widest whitespace-nowrap">{new Date(post.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                    {editingPost?.id === post.id ? (
                      <div className="space-y-4">
                        <textarea
                          className="w-full p-4 rounded-xl bg-gray-50 dark:bg-gray-800 border-none focus:ring-2 focus:ring-purple-500 resize-none h-24"
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                        />
                        <div className="flex justify-end gap-2">
                          <button onClick={() => setEditingPost(null)} className="bg-gray-200 text-gray-800 hover:bg-gray-300 rounded-xl px-4 py-1 font-bold text-xs">Cancel</button>
                          <button onClick={() => handleEditSubmit(post.id)} className="bg-purple-600 text-white hover:bg-purple-700 rounded-xl px-4 py-1 font-bold text-xs">Save</button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="text-lg leading-relaxed">
                            <FormattedText text={post.content} />
                        </div>
                        <div className="flex items-center gap-2 mt-4 pt-3 border-t border-gray-50 dark:border-gray-900/50">
                            <button 
                              onClick={() => {
                                setEditingPost(post);
                                setEditContent(post.content);
                              }} 
                              className="px-4 py-1.5 bg-purple-50 dark:bg-purple-950/20 text-purple-600 dark:text-purple-400 font-extrabold text-xs rounded-xl hover:bg-purple-100 dark:hover:bg-purple-950/50 transition-all active:scale-95"
                            >
                              ✍️ Edit Post
                            </button>
                            <button 
                              onClick={() => handleDelete(post.id)} 
                              className="px-4 py-1.5 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 font-extrabold text-xs rounded-xl hover:bg-red-100 dark:hover:bg-red-950/50 transition-all active:scale-95"
                            >
                              🗑️ Delete Post
                            </button>
                        </div>
                      </>
                    )}
                    <MediaCarousel mediaString={post.media_url} type={post.type} />
                    <PostInteractions 
                      postId={post.id}
                      initialLikes={post.likes_count || 0}
                      initialComments={post.comments_count || 0}
                      initialViews={(post.views_count || 0) + 1}
                      isLikedInitially={post.liked_by_me || false}
                    />
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default SocialDashboard;
