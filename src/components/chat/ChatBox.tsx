"use client";

import React, { useEffect, useState, useRef } from "react";
import { useSocket } from "@/hooks/useSocket";
import { useAuth } from "@/hooks/useAuth";
import { formatDate } from "@/utils/date";

interface Message {
  _id: string;
  sender:
    | {
        _id: string;
        name: string;
        email: string;
        isOnline?: boolean;
        lastSeen?: string;
      }
    | string;
  message: string;
  text?: string;
  createdAt: string;
  isRead?: boolean;
}

interface Partner {
  _id: string;
  name: string;
  email: string;
  isOnline?: boolean;
  lastSeen?: string;
}

interface ChatBoxProps {
  roomId: string; // The ID of the chat room
  userId: string; // Current user ID
}

const ChatBox: React.FC<ChatBoxProps> = ({ roomId, userId }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [partner, setPartner] = useState<Partner | null>(null);
  const [newMessage, setNewMessage] = useState("");

  const { user } = useAuth();
  const [token, setToken] = useState<string | null>(null);

  // Hydrate token client-side
  useEffect(() => {
    if (typeof window !== "undefined") {
      setToken(localStorage.getItem("token"));
    }
  }, []);

  const { socket } = useSocket(token);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchMessages = async () => {
    if (!roomId) return;
    const currentToken =
      token ||
      (typeof window !== "undefined" ? localStorage.getItem("token") : null);
    if (!currentToken) return;

    try {
      const res = await fetch(`/api/chat/message?roomId=${roomId}`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${currentToken}`,
        },
      });

      const data = await res.json();
      if (data.success) {
        // New structure: { messages, partner }
        if (data.data.messages) {
          setMessages(data.data.messages);
        } else if (Array.isArray(data.data)) {
          // Fallback for old API just in case
          setMessages(data.data);
        }

        if (data.data.partner) {
          setPartner(data.data.partner);
        }
      }
    } catch (err) {
          }
  };

  // Initial fetch and Polling
  useEffect(() => {
    fetchMessages().then(() => setTimeout(scrollToBottom, 100));

    // Poll every 5 seconds for updates (messages + read status + partner online)
    const interval = setInterval(fetchMessages, 5000);
    return () => clearInterval(interval);
  }, [roomId, token]);

  // Socket listener (Real-time fallback)
  // Ensures we re-join room on socket reconnect
  useEffect(() => {
    if (!socket || !roomId) return;

    socket.emit("joinRoom", roomId);

    const handleMessage = (msg: any) => {
      if (msg) {
        setMessages((prev) => {
          if (prev.some((m) => m._id === msg._id)) return prev;
          return [...prev, msg];
        });
        setTimeout(scrollToBottom, 50);

        // If message is from partner, update their status to Online immediately
        // Check if sender matches partner ID
        const senderId =
          typeof msg.sender === "object" ? msg.sender._id : msg.sender;

        setPartner((prev) => {
          if (prev && senderId === prev._id) {
            return {
              ...prev,
              isOnline: true,
              lastSeen: new Date().toISOString(),
            };
          }
          return prev;
        });
      }
    };

    socket.on("newMessage", handleMessage);

    socket.on("user:online", ({ userId }: { userId: string }) => {
      setPartner((prev) => {
        if (prev && prev._id === userId) {
          return {
            ...prev,
            isOnline: true,
            lastSeen: new Date().toISOString(),
          };
        }
        return prev;
      });
    });

    socket.on(
      "user:offline",
      ({ userId, lastSeen }: { userId: string; lastSeen: string }) => {
        setPartner((prev) => {
          if (prev && prev._id === userId) {
            return { ...prev, isOnline: false, lastSeen };
          }
          return prev;
        });
      },
    );

    return () => {
      socket.off("newMessage", handleMessage);
      socket.off("user:online");
      socket.off("user:offline");
    };
  }, [socket, roomId]);

  const handleSend = async () => {
    if (!newMessage.trim()) return;
    const currentToken =
      token ||
      (typeof window !== "undefined" ? localStorage.getItem("token") : null);
    if (!currentToken) return;

    const textPayload = newMessage;
    setNewMessage("");

    try {
      const res = await fetch("/api/chat/message", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${currentToken}`,
        },
        body: JSON.stringify({
          roomId,
          text: textPayload,
        }),
      });

      const data = await res.json();
      if (data.success && data.data) {
        let sentMsg = data.data;
        // Patch sender immediately for optimistic UI
        if (!sentMsg.sender || typeof sentMsg.sender === "string") {
          sentMsg.sender = {
            _id: userId,
            name: user?.name || "You",
            email: user?.email || "",
          };
        }
        // Add optimistic message (or real API response)
        setMessages((prev) => [...prev, sentMsg]);
        setTimeout(scrollToBottom, 50);

        if (socket) {
          socket.emit("sendMessage", { ...sentMsg, roomId });
        }

        // Refresh immediately using polling function to ensure logic consistency
        fetchMessages();
      }
    } catch (err) {
          }
  };

  // Format Last Seen
  const getLastSeenText = (lastSeen?: string) => {
    if (!lastSeen) return "Offline";
    const date = new Date(lastSeen);
    const now = new Date();
    const diffMinutes = (now.getTime() - date.getTime()) / (1000 * 60);

    // If less than 10 minutes, consider "Online" (even if strictly offline, just active recently)
    if (diffMinutes < 10) return "Online";

    if (diffMinutes < 60)
      return `Offline • ${Math.floor(diffMinutes)} minutes ago`;

    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24)
      return `Offline • ${diffHours} ${diffHours === 1 ? "hour" : "hours"} ago`;

    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7)
      return `Offline • ${diffDays} ${diffDays === 1 ? "day" : "days"} ago`;

    const diffWeeks = Math.floor(diffDays / 7);
    if (diffWeeks < 4)
      return `Offline • ${diffWeeks} ${diffWeeks === 1 ? "week" : "weeks"} ago`;

    const diffMonths = Math.floor(diffDays / 30);
    if (diffMonths < 12)
      return `Offline • ${diffMonths} ${diffMonths === 1 ? "month" : "months"} ago`;

    const diffYears = Math.floor(diffDays / 365);
    return `Offline • ${diffYears} ${diffYears === 1 ? "year" : "years"} ago`;
  };

  // Explicit online check using partner data from API
  // Trust the API 'isOnline' but fallback to 'lastSeen' check if API flag is stale (unlikely with polling)
  // But also check if partner explicitly exists
  const isPartnerOnline =
    partner?.isOnline ||
    (partner?.lastSeen &&
      new Date().getTime() - new Date(partner.lastSeen).getTime() <
        10 * 60 * 1000);

  return (
    <div className="flex flex-col h-full bg-white dark:bg-[#0a0a0a] overflow-hidden relative">
      {/* Header */}
      <div className="px-6 border-b dark:border-white/5 flex justify-between items-center h-16 bg-white/80 dark:bg-black/80 backdrop-blur-xl z-10 shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={() => window.history.back()} className="md:hidden p-2 -ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/5 transition-all">
             <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          </button>
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center text-white font-black shadow-md shrink-0">
             {partner?.name ? partner.name[0].toUpperCase() : 'C'}
          </div>
          <div className="min-w-0">
            <h2 className="font-extrabold text-gray-900 dark:text-white text-base leading-tight truncate">
                {partner?.name || "Chat Room"}
            </h2>
            <div className="flex items-center gap-1.5 mt-0.5">
                {isPartnerOnline ? (
                    <>
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                        <span className="text-[10px] text-green-500 font-bold uppercase tracking-widest">Active Now</span>
                    </>
                ) : (
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest truncate">
                        {getLastSeenText(partner?.lastSeen)}
                    </span>
                )}
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-4 md:space-y-6 bg-gray-50/50 dark:bg-[#050505] custom-scrollbar pb-24 md:pb-8">
        {messages.length === 0 && !partner && (
          <div className="flex flex-col items-center justify-center h-full opacity-30 grayscale">
            <h2 className="text-xl font-black uppercase tracking-widest">Starting Secret...</h2>
          </div>
        )}

        {messages.map((msg, index) => {
          const senderId = typeof msg.sender === "object" ? msg.sender._id : msg.sender;
          const isMe = senderId === userId;
          const content = msg.message || msg.text || (msg as any).content || "";

          return (
            <div
              key={msg._id || index}
              className={`flex ${isMe ? "justify-end" : "justify-start"} animate-in slide-in-from-bottom-2 duration-300`}
            >
              <div className={`flex flex-col gap-1 max-w-[85%] md:max-w-[70%]`}>
                <div
                    className={`px-5 py-3 rounded-[1.6rem] text-sm md:text-md font-bold tracking-tight shadow-sm transition-all ${
                    isMe
                        ? "bg-blue-600 text-white rounded-br-none"
                        : "bg-white dark:bg-[#151515] border border-gray-100 dark:border-white/5 text-gray-800 dark:text-gray-100 rounded-bl-none shadow-[0_2px_10px_rgba(0,0,0,0.02)]"
                    }`}
                >
                    <p className="leading-relaxed">{content}</p>
                </div>
                <div className={`flex items-center gap-1.5 px-2 mt-1 ${isMe ? "justify-end" : "justify-start"}`}>
                    <span className="text-[9px] text-gray-400 font-black uppercase opacity-60 tracking-widest">
                        {msg.createdAt ? formatDate(msg.createdAt) : ""}
                    </span>
                    {isMe && (
                        <div className={`flex items-center ${msg.isRead ? "text-blue-500" : "text-gray-300"}`}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
                            {msg.isRead && <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="-ml-2"><path d="M20 6 9 17l-5-5"/></svg>}
                        </div>
                    )}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef}></div>
      </div>

      {/* Input */}
      <div className="p-4 md:p-6 bg-white dark:bg-[#0a0a0a] border-t dark:border-white/5 shrink-0 z-20">
        <div className="max-w-4xl mx-auto flex items-center gap-2 md:gap-3 bg-gray-50 dark:bg-white/5 p-1.5 pl-5 rounded-full border border-gray-100 dark:border-white/5 focus-within:ring-4 focus-within:ring-blue-500/10 transition-all shadow-sm">
            <input
                type="text"
                placeholder="Message..."
                className="flex-1 bg-transparent border-none focus:ring-0 text-sm md:text-md py-2.5 md:py-3 dark:text-gray-100 font-bold placeholder:opacity-40"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
            />
            <button
                onClick={handleSend}
                disabled={!newMessage.trim()}
                className={`p-3 md:p-3.5 rounded-full transition-all active:scale-90 ${
                    newMessage.trim()
                    ? "bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-500/20"
                    : "bg-gray-200 dark:bg-white/10 text-gray-400 cursor-not-allowed"
                }`}
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={newMessage.trim() ? "translate-x-0.5" : ""}
                >
                    <path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/>
                </svg>
            </button>
        </div>
      </div>
      
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.05); border-radius: 20px; }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.05); }
      `}</style>
    </div>
  );
};

export default ChatBox;
