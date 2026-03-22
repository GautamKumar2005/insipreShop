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
  const [activeTab, setActiveTab] = useState<'page' | 'my_content' | 'settings'>('page');
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [stats, setStats] = useState({ followers: 0, following: 0, posts: 0 });
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

  const [showFollowModal, setShowFollowModal] = useState<'followers' | 'following' | null>(null);
  const [followUsersList, setFollowUsersList] = useState<any[]>([]);

  const fetchFollowList = async (type: 'followers' | 'following') => {
    if (!user) return;
    try {
      setFollowUsersList([]);
      setShowFollowModal(type);
      const res = await fetch(`/api/social/${type}?userId=${user.id}`);
      const data = await res.json();
      if (data.success) {
        setFollowUsersList(data.data);
      }
    } catch (err) {
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
          <h1 className="text-3xl font-black text-gray-900 dark:text-white mb-4 tracking-tighter">Your Social Sanctuary</h1>
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
    <div className="max-w-4xl mx-auto py-10 px-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Modal for Followers/Following */}
      {showFollowModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white dark:bg-gray-900 rounded-3xl w-full max-w-sm max-h-[70vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between sticky top-0 bg-white dark:bg-gray-900 z-10">
              <h3 className="font-bold text-lg capitalize">{showFollowModal}</h3>
              <button onClick={() => setShowFollowModal(null)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {followUsersList.length === 0 ? (
                <p className="text-center text-gray-500 py-10 font-medium">No one found.</p>
              ) : (
                followUsersList.map(u => (
                  <div key={u._id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900 overflow-hidden flex items-center justify-center text-purple-600 font-bold border border-gray-100 dark:border-gray-800">
                        {u.avatar ? <img src={u.avatar} alt={u.name} className="w-full h-full object-cover"/> : u.name?.[0]}
                      </div>
                      <Link onClick={() => setShowFollowModal(null)} href={`/social/profile/${u._id}`} className="font-bold text-sm hover:underline">{u.name}</Link>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      <Card className="mb-8 p-8 border-none shadow-xl bg-gradient-to-br from-white to-purple-50 dark:from-gray-900 dark:to-[#0a0a0a] rounded-[2rem] ring-1 ring-black/5 dark:ring-white/5 relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-purple-500/10 dark:bg-purple-500/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-40 h-40 bg-pink-500/10 dark:bg-pink-500/20 rounded-full blur-3xl"></div>
        
        <div className="relative z-10 flex flex-col items-center sm:flex-row sm:items-start gap-6 md:gap-8">
          <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full overflow-hidden border-4 border-white dark:border-gray-800 shadow-xl flex-shrink-0 bg-white">
            <div className="w-full h-full bg-gradient-to-tr from-purple-100 to-pink-100 dark:from-purple-900/40 dark:to-pink-900/40 flex items-center justify-center text-3xl sm:text-4xl font-black text-purple-600">
              {user.avatar ? <img src={user.avatar} className="w-full h-full object-cover"/> : user.name?.[0].toUpperCase()}
            </div>
          </div>
          
          <div className="flex-1 text-center sm:text-left">
             <div className="inline-block px-3 py-1 mb-2 rounded-full bg-purple-100/50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 text-xs sm:text-sm font-bold tracking-widest uppercase">
               @{profileData.username || `user_${user.id.slice(-6)}`}
             </div>
             <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-gray-900 dark:text-white mb-2">{profileData.name || user.name}</h1>
             
             {profileData.bio && (
                <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 mb-6 max-w-md font-medium">{profileData.bio}</p>
             )}
 
             <div className="flex justify-center sm:justify-start gap-4 sm:gap-8 mt-4">
               <div onClick={() => fetchFollowList('followers')} className="text-center md:text-left cursor-pointer hover:opacity-75 transition-opacity">
                 <p className="text-2xl font-black text-gray-900 dark:text-white">{stats.followers}</p>
                 <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Followers</p>
               </div>
               <div onClick={() => fetchFollowList('following')} className="text-center md:text-left cursor-pointer hover:opacity-75 transition-opacity">
                 <p className="text-2xl font-black text-gray-900 dark:text-white">{stats.following}</p>
                 <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Following</p>
               </div>
               <div className="text-center md:text-left">
                 <p className="text-2xl font-black text-gray-900 dark:text-white">{stats.posts}</p>
                 <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Posts</p>
               </div>
             </div>
          </div>
        </div>
      </Card>

      <div className="flex gap-2 sm:gap-4 mb-8 border-b border-gray-200 dark:border-gray-800 pb-4 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveTab('page')}
          className={`px-3 sm:px-4 py-2 font-bold rounded-xl transition-all text-sm sm:text-base shrink-0 ${
            activeTab === 'page' 
              ? 'bg-purple-100 text-purple-600 dark:bg-purple-900/30' 
              : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'
          }`}
        >
          Create Content
        </button>
        <button
          onClick={() => setActiveTab('my_content')}
          className={`px-3 sm:px-4 py-2 font-bold rounded-xl transition-all text-sm sm:text-base shrink-0 ${
            activeTab === 'my_content' 
              ? 'bg-purple-100 text-purple-600 dark:bg-purple-900/30' 
              : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'
          }`}
        >
          My Content
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`px-3 sm:px-4 py-2 font-bold rounded-xl transition-all text-sm sm:text-base shrink-0 ${
            activeTab === 'settings' 
              ? 'bg-purple-100 text-purple-600 dark:bg-purple-900/30' 
              : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'
          }`}
        >
          Settings
        </button>
      </div>

      {activeTab === 'page' && (
        <Card className="p-8 border-none shadow-2xl bg-white/70 dark:bg-gray-900/70 backdrop-blur-2xl rounded-3xl ring-1 ring-black/5 dark:ring-white/5">
          <h2 className="text-2xl font-bold mb-6">What do you want to share today?</h2>
          <form onSubmit={handleShare} className="space-y-6">
            <div className="flex items-center gap-2 p-1 bg-gray-100 dark:bg-gray-800 rounded-2xl w-full sm:w-fit overflow-x-auto no-scrollbar">
              {(['page', 'reel', 'tweet'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  className={`flex-1 sm:flex-none px-6 sm:px-8 py-3 rounded-xl text-xs sm:text-sm font-bold uppercase tracking-widest transition-all ${
                    type === t 
                      ? 'bg-white dark:bg-gray-700 shadow-lg text-purple-600 scale-105' 
                      : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            <div className="space-y-2">
               <textarea
                 placeholder={`Write your ${type} content here... (Use #Hashtag and @Mention)`}
                 value={content}
                 onChange={(e) => setContent(e.target.value)}
                 className="w-full min-h-[160px] bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-6 border-none focus:ring-2 focus:ring-purple-500 text-xl resize-none shadow-inner"
               />
               {content.includes('#') || content.includes('@') ? (
                  <div className="p-4 bg-purple-50 dark:bg-purple-900/10 rounded-2xl border border-purple-100 dark:border-purple-900/20">
                     <p className="text-[10px] font-black uppercase text-purple-500 mb-2 tracking-[0.2em]">Post Preview:</p>
                     <div className="text-lg">
                        <FormattedText text={content} />
                     </div>
                  </div>
               ) : null}
            </div>

            <div className="flex flex-col gap-4">
              <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Attach Media</label>
              <CldUploadWidget 
                signatureEndpoint="/api/cloudinary-sign"
                onSuccess={(result: any) => {
                  setMediaUrls(prev => [...prev, result.info.secure_url]);
                }}
                options={{ multiple: true, maxFiles: 10, sources: ['local', 'camera'], cropping: true } as any}
              >
                {({ open }) => (
                  <button 
                    type="button" 
                    onClick={() => open()} 
                    className="w-full text-left py-6 px-8 rounded-3xl border-2 border-dashed border-purple-200 dark:border-gray-800 text-lg font-bold bg-purple-50/50 hover:bg-purple-50 dark:bg-gray-800/50 text-purple-700 dark:text-purple-400 transition-all cursor-pointer flex flex-col items-center gap-2"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>
                    <span>Upload Images/Videos</span>
                  </button>
                )}
              </CldUploadWidget>

              {mediaUrls.length > 0 && (
                <div className="flex gap-4 flex-wrap bg-gray-50/50 dark:bg-gray-800/50 p-4 rounded-2xl border border-gray-100 dark:border-gray-800">
                  {mediaUrls.map((url, i) => (
                    <div key={i} className="w-20 h-20 rounded-xl overflow-hidden border-2 border-white dark:border-gray-800 shadow-md relative group">
                       <img src={url} className="w-full h-full object-cover" />
                       <button type="button" onClick={() => setMediaUrls(urls => urls.filter((_, idx) => idx !== i))} className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity text-white flex items-center justify-center">
                         <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                       </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end">
              <Button 
                type="submit" 
                disabled={loading || !content.trim()}
                className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-4 px-10 rounded-full transition-all disabled:opacity-50 text-lg shadow-xl"
              >
                {loading ? "Publishing..." : `Publish ${type}`}
              </Button>
            </div>
          </form>
        </Card>
      )}

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
                        <div className="flex gap-4 mt-2">
                            <button onClick={() => {
                                setEditingPost(post);
                                setEditContent(post.content);
                            }} className="text-purple-500 text-xs font-bold hover:underline">Edit</button>
                            <button onClick={() => handleDelete(post.id)} className="text-red-500 text-xs font-bold hover:underline">Delete</button>
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
