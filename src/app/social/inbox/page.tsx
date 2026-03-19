"use client";

import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { FormattedText } from "@/components/social/FormattedText";

interface Contact {
  id: string;
  name: string;
  avatar: string | null;
  lastMessage: string;
  time: string;
  online: boolean;
}

interface Message {
    id: string;
    sender_id: string;
    receiver_id: string;
    content: string;
    reaction?: string;
    created_at: string;
}

const EMOJIS = [
    "❤️", "🔥", "😂", "🤣", "✨", "🙌", "🙏", "👍", "😎", "😍", "🎉", "💯", "👋", "👀", "🤔", "😭", "😤", "🤯", "🥰", "🥳", "🥺", "💀", "🤫", "🫣", "🫠", 
    "🚀", "💎", "🌈", "🎈", "🍕", "🍔", "🍦", "🍭", "🍻", "🥂", "🐶", "🐱", "🦁", "🐼", "🐨", "🦾", "⚡", "🌟", "🌍"
];

const PostPreview = ({ postId }: { postId: string }) => {
    const [post, setPost] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPost = async () => {
            try {
                const res = await fetch(`/api/social/${postId}`);
                const data = await res.json();
                if (data.success) setPost(data.data);
            } catch(e) {} finally {
                setLoading(false);
            }
        };
        fetchPost();
    }, [postId]);

    if (loading) return null;
    if (!post) return null;

    return (
        <Link href={`/social/post/${postId}`} className="block mt-1 rounded-[1.5rem] overflow-hidden border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-zinc-900 shadow-sm hover:brightness-95 transition-all group max-w-[260px] ring-1 ring-black/5">
            {post.media_url ? (
                <div className="aspect-square bg-gray-200 dark:bg-black/20 overflow-hidden border-b border-gray-100 dark:border-white/5 relative">
                    <img src={post.media_url.split(',')[0]} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000" alt="Preview" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                </div>
            ) : (
                <div className="p-5 bg-gray-100 dark:bg-zinc-800 border-b border-gray-100 dark:border-white/5">
                   <p className="text-xs font-black text-gray-800 dark:text-gray-100 line-clamp-3 leading-relaxed">
                       {post.content}
                   </p>
                </div>
            )}
            <div className="p-4 bg-white dark:bg-[#151515] flex items-center gap-3">
                <div className="w-8 h-8 rounded-full border border-gray-200 dark:border-white/10 overflow-hidden flex-shrink-0 flex items-center justify-center font-black text-[10px] text-gray-500 bg-gray-50 dark:bg-white/5 shadow-sm">
                    {post.user?.avatar ? <img src={post.user.avatar} className="w-full h-full object-cover" /> : post.user?.name?.[0]}
                </div>
                <div className="flex flex-col min-w-0">
                    <span className="text-[11px] font-black text-gray-900 dark:text-white tracking-tight truncate">{post.user?.name}</span>
                    <div className="flex items-center gap-2">
                        <span className="text-[8px] text-gray-500 dark:text-gray-400 font-black uppercase tracking-widest">{post.type}</span>
                        <div className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-700"></div>
                        <span className="text-[8px] text-blue-500 dark:text-blue-400 font-black uppercase tracking-widest">View Post</span>
                    </div>
                </div>
            </div>
        </Link>
    );
};

const InboxPage = () => {
  const searchParams = useSearchParams();
  const initialUserId = searchParams.get("user");

  const { user, getToken } = useAuth();
  const [activeChat, setActiveChat] = useState<string | null>(initialUserId);
  const [message, setMessage] = useState("");
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [chatHistory, setChatHistory] = useState<Message[]>([]);
  const [sending, setSending] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatHistory]);

  const fetchChatHistory = async (otherId: string) => {
    const token = getToken();
    if (!token) return;
    try {
        const res = await fetch(`/api/social/messages?otherId=${otherId}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) {
            setChatHistory(data.data);
        }
    } catch (err) { }
  };

  useEffect(() => {
    if (activeChat) {
        fetchChatHistory(activeChat);
        const interval = setInterval(() => fetchChatHistory(activeChat!), 5000);
        return () => clearInterval(interval);
    }
  }, [activeChat]);

  useEffect(() => {
    const fetchAuthorizedContacts = async () => {
      if (!user) return;
      try {
        setLoading(true);
        const meRes = await fetch(`/api/users/${user.id}`);
        const meData = await meRes.json();
        const myData = meData.data;

        if (myData) {
          const authorizedIds = new Set([
            ...(myData.following || []),
            ...(myData.followers || [])
          ]);

          const usersRes = await fetch("/api/users");
          const usersData = await usersRes.json();

          if (usersData.success) {
            const mappedContacts = usersData.data
              .filter((u: any) => authorizedIds.has(u._id) && u._id !== user.id)
              .map((u: any) => ({
                id: u._id,
                name: u.name,
                avatar: u.profilePhoto?.url || null,
                lastMessage: "Start a conversation",
                time: "now",
                online: true
              }));
            setContacts(mappedContacts);
          }
        }
      } catch (err) { } finally {
        setLoading(false);
      }
    };

    fetchAuthorizedContacts();
  }, [user]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !activeChat || sending) return;
    
    const token = getToken();
    if (!token) return;

    const currentMsg = message;
    setMessage("");
    setSending(true);
    setShowEmojiPicker(false);

    try {
        const res = await fetch("/api/social/messages", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({ receiverId: activeChat, content: currentMsg })
        });
        const data = await res.json();
        if (data.success) {
            setChatHistory(prev => [...prev, data.data]);
        }
    } catch (err) {
        setMessage(currentMsg);
    } finally {
        setSending(false);
    }
  };

  const handleReact = async (messageId: string, emoji: string) => {
      const token = getToken();
      if (!token) return;
      
      setChatHistory(prev => prev.map(m => m.id === messageId ? { ...m, reaction: m.reaction === emoji ? undefined : emoji } : m));

      try {
          await fetch("/api/social/messages/react", {
              method: "POST",
              headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${token}`
              },
              body: JSON.stringify({ messageId, reaction: emoji })
          });
      } catch(e) {}
  };

  const addEmoji = (emoji: string) => {
    setMessage(prev => prev + emoji);
  };

  useEffect(() => {
     const handleClickOutside = (event: MouseEvent) => {
       if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
         setShowEmojiPicker(false);
       }
     };
     document.addEventListener("mousedown", handleClickOutside);
     return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!user) {
    return (
       <div className="flex items-center justify-center min-h-screen bg-white dark:bg-[#000]">
          <p className="text-xl font-black text-gray-400">Please login to access messages.</p>
       </div>
    );
  }

  const activeUser = contacts.find(c => c.id === activeChat);

  return (
    <div className="w-full h-screen p-0 m-0 flex flex-col animate-in fade-in duration-1000 bg-white dark:bg-[#000]">
      <div className="flex-1 flex overflow-hidden border-none bg-white dark:bg-[#000] overflow-hidden relative">
        
        {/* Sidebar - Contacts */}
        <div className={`w-full md:w-[350px] border-r border-gray-100 dark:border-white/5 flex flex-col z-10 ${activeChat ? 'hidden md:flex' : 'flex'}`}>
          <div className="p-6 md:p-8 flex items-center justify-between border-b border-gray-50 dark:border-white/5">
                <h1 className="text-xl md:text-2xl font-black text-gray-900 dark:text-white tracking-tighter uppercase">{user.name}</h1>
                <button className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-xl transition-all">
                    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                </button>
          </div>
          
          <div className="flex-1 overflow-y-auto pt-2 px-1 custom-scrollbar">
            {loading ? (
              <div className="flex justify-center p-12"><div className="w-8 h-8 border-2 border-gray-200 dark:border-white/10 border-t-blue-500 rounded-full animate-spin"></div></div>
            ) : contacts.length === 0 ? (
              <div className="p-12 text-center text-sm text-gray-400 font-black opacity-30 uppercase tracking-widest">No Active Chats</div>
            ) : (
                contacts.map((contact) => (
                  <div 
                    key={contact.id} 
                    onClick={() => setActiveChat(contact.id)}
                    className={`p-4 px-6 flex items-center gap-4 cursor-pointer transition-all hover:bg-gray-50 dark:hover:bg-white/5 group ${
                      activeChat === contact.id ? 'bg-gray-50 dark:bg-white/5' : ''
                    }`}
                  >
                    <div className="relative shrink-0">
                      <div className="w-[3.5rem] h-[3.5rem] rounded-full border border-gray-100 dark:border-white/10 overflow-hidden bg-gray-100 dark:bg-gray-800 flex items-center justify-center font-black text-gray-600 shadow-sm group-hover:scale-105 transition-transform duration-500">
                        {contact.avatar ? <img src={contact.avatar} className="w-full h-full object-cover" /> : contact.name[0]}
                      </div>
                      <div className="absolute bottom-0.5 right-0.5 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white dark:border-[#000] shadow-sm" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-black text-sm truncate dark:text-gray-100 tracking-tight">{contact.name}</h3>
                      <p className="text-[11px] text-gray-400 truncate opacity-80 font-bold mt-0.5">{contact.lastMessage}</p>
                    </div>
                  </div>
                ))
            )}
          </div>
        </div>

        {/* Messaging Area */}
        <div className={`flex-1 flex flex-col bg-white dark:bg-[#000] ${activeChat ? 'flex' : 'hidden md:flex'} relative`}>
          {activeChat ? (
            <>
              {/* Header */}
              <div className="p-4 px-8 border-b border-gray-100 dark:border-white/5 flex items-center justify-between sticky top-0 bg-white/95 dark:bg-[#000]/95 backdrop-blur-3xl z-20">
                <div className="flex items-center gap-4">
                  <button onClick={() => setActiveChat(null)} className="md:hidden p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/5 transition-all">
                     <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="m15 18-6-6 6-6"/></svg>
                  </button>
                  <Link href={`/social/profile/${activeChat}`} className="flex items-center gap-4 group">
                    <div className="w-11 h-11 rounded-full border border-gray-100 dark:border-white/10 overflow-hidden bg-gray-50 dark:bg-gray-800 flex items-center justify-center font-black group-hover:scale-110 transition-transform shadow-md duration-500">
                        {activeUser?.avatar ? <img src={activeUser.avatar} className="w-full h-full object-cover" /> : activeUser?.name?.[0]}
                    </div>
                    <div className="flex flex-col">
                        <span className="font-black text-lg leading-none group-hover:underline tracking-tighter">{activeUser?.name}</span>
                        <div className="flex items-center gap-1.5 mt-1">
                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.5)]"></div>
                            <span className="text-[10px] text-green-500 font-bold uppercase tracking-widest">Online Now</span>
                        </div>
                    </div>
                  </Link>
                </div>
                <div className="flex items-center gap-6 text-gray-400">
                    <button className="p-2 hover:text-blue-500 transition-all active:scale-75"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg></button>
                    <button className="p-2 hover:text-blue-500 transition-all active:scale-75"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect width="20" height="15" x="2" y="3" rx="2" ry="2"/><path d="M10 8l5 5-5 5"/></svg></button>
                </div>
              </div>

              {/* Chat Content */}
              <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 md:p-12 pb-20 flex flex-col gap-6 custom-scrollbar bg-white dark:bg-[#000]">
                {chatHistory.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center opacity-30 mt-20 grayscale">
                     <h2 className="text-xl font-black uppercase tracking-widest leading-none">Direct Connection</h2>
                     <p className="max-w-[200px] text-[10px] font-black uppercase mt-4 opacity-50">Say hello to {activeUser?.name}</p>
                  </div>
                ) : chatHistory.map((msg, i) => {
                  const isMe = msg.sender_id === user.id;
                  const postLinkMatch = msg.content.match(/\/social\/post\/([a-zA-Z0-9-]+)/);
                  const sharePostId = postLinkMatch ? postLinkMatch[1] : null;

                  return (
                    <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} group/msg relative`}>
                      <div className={`flex flex-col gap-1 max-w-[75%] relative`}>
                        <div 
                          onDoubleClick={() => handleReact(msg.id, "❤️")}
                          className={`px-5 py-3 rounded-[1.8rem] text-sm font-bold tracking-tight shadow-md ring-1 transition-all ${
                          isMe 
                            ? 'bg-blue-600 text-white rounded-br-sm border-blue-400/20 ring-blue-500/10' 
                            : 'bg-gray-100 dark:bg-[#111] dark:text-gray-100 rounded-bl-sm border-gray-200 dark:border-white/5 ring-black/5'
                        } ${sharePostId ? 'bg-transparent shadow-none border-none p-0 ring-0' : ''}`}>
                          {!sharePostId ? (
                              <FormattedText text={msg.content} />
                          ) : (
                              <PostPreview postId={sharePostId} />
                          )}

                          {msg.reaction && (
                              <div className={`absolute -bottom-2 ${isMe ? '-left-1' : '-right-1'} bg-white dark:bg-[#222] shadow-xl border border-gray-100 dark:border-white/10 rounded-full w-6 h-6 flex items-center justify-center text-[10px] animate-in zoom-in-50 duration-300 ring-2 ring-blue-500/10`}>
                                  {msg.reaction}
                              </div>
                          )}
                        </div>
                        
                        <button 
                            onClick={() => handleReact(msg.id, "❤️")}
                            className={`absolute -top-3 ${isMe ? 'right-0' : 'left-0'} p-1.5 bg-white dark:bg-[#111] shadow-lg border border-gray-100 dark:border-white/10 rounded-full opacity-0 group-hover/msg:opacity-100 transition-all hover:scale-110 active:scale-125 z-10`}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill={msg.reaction === '❤️' ? "red" : "none"} stroke={msg.reaction === '❤️' ? "red" : "currentColor"} strokeWidth="3"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>
                        </button>

                        <span className={`text-[9px] text-gray-400 font-black uppercase opacity-50 px-2 mt-1.5 tracking-widest ${isMe ? 'text-right' : 'text-left'}`}>
                            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Input Area */}
              <div className="p-4 md:p-8 pt-2 pb-8 relative z-30">
                {showEmojiPicker && (
                    <>
                        <div className="fixed inset-0 z-[55]" onClick={() => setShowEmojiPicker(false)}></div>
                        <div ref={emojiPickerRef} className="absolute bottom-full mb-4 left-8 p-5 bg-white dark:bg-[#0a0a0a] border border-gray-100 dark:border-white/10 rounded-[2.5rem] shadow-[0_20px_60px_rgba(0,0,0,0.2)] dark:shadow-[0_20px_60px_rgba(0,0,0,0.4)] flex flex-wrap gap-3 w-72 z-[60] animate-in slide-in-from-bottom-4 zoom-in-95 duration-300">
                            <div className="w-full text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">Popular Emojis</div>
                            {EMOJIS.map(e => (
                                <button key={e} onClick={() => addEmoji(e)} className="text-2xl hover:scale-150 p-1.5 transition-all active:scale-90 duration-300 transform-gpu">{e}</button>
                            ))}
                        </div>
                    </>
                )}

                <form 
                  onSubmit={handleSendMessage} 
                  className="flex items-center gap-3 p-3 px-8 border border-gray-100 dark:border-white/5 rounded-full focus-within:ring-4 focus-within:ring-blue-500/10 transition-all bg-white dark:bg-[#080808] shadow-[0_10px_40px_rgba(0,0,0,0.05)] dark:shadow-none"
                >
                  <button type="button" onClick={() => setShowEmojiPicker(!showEmojiPicker)} className={`p-1.5 transition-all active:scale-75 ${showEmojiPicker ? 'text-blue-500 rotate-12 scale-110' : 'text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" x2="9.01" y1="9" y2="9"/><line x1="15" x2="15.01" y1="9" y2="9"/></svg>
                  </button>
                  <input
                    type="text"
                    placeholder="Type to express..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="flex-1 bg-transparent border-none focus:ring-0 text-md py-4 dark:text-gray-100 font-bold placeholder:opacity-40"
                  />
                  {message.trim() ? (
                    <button 
                      type="submit"
                      disabled={sending}
                      className="text-blue-500 font-black text-sm uppercase px-5 active:scale-90 transition-transform bg-blue-50 dark:bg-blue-500/10 py-2.5 rounded-full hover:bg-blue-100 dark:hover:bg-blue-500/20"
                    >
                      Send
                    </button>
                  ) : (
                    <div className="flex gap-6 text-gray-400 pr-2">
                        <button type="button" className="hover:text-blue-500 transition-all active:scale-90"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/></svg></button>
                        <button type="button" className="hover:text-pink-500 transition-all active:scale-150"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg></button>
                    </div>
                  )}
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-20 text-center animate-in fade-in duration-1000 bg-gray-50/10 dark:bg-[#000]">
               <div className="w-32 h-32 mb-10 rounded-full border-2 border-gray-900 dark:border-white shadow-2xl flex items-center justify-center relative bg-white dark:bg-[#000] rotate-3">
                  <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14l4-4h10a2 2 0 0 0 2-2Z"/></svg>
               </div>
               <h2 className="text-4xl font-black tracking-tighter uppercase mb-4">Your Inbox</h2>
               <Link href="/social" className="mt-12 px-14 py-4 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-black rounded-full hover:scale-105 transition-all shadow-2xl active:scale-95 uppercase tracking-widest text-xs">Start New Chat</Link>
            </div>
          )}
        </div>
      </div>
      
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.05); border-radius: 20px; }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.05); }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
};

export default InboxPage;
