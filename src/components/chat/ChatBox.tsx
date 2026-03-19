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
      console.error("Failed to fetch messages", err);
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
      console.error("Failed to send message", err);
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
    <div className="flex flex-col h-full bg-white rounded-lg shadow-sm border overflow-hidden">
      {/* Header */}
      <div className="p-3 bg-gray-100 border-b flex justify-between items-center h-16">
        <div>
          <h2 className="font-semibold text-gray-800 text-lg">
            {partner?.name || "Chat"}
          </h2>
          <p className="text-xs text-gray-500">
            {isPartnerOnline ? (
              <span className="text-green-600 font-bold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-green-500 inline-block"></span>{" "}
                Online
              </span>
            ) : (
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-gray-400 inline-block"></span>{" "}
                {getLastSeenText(partner?.lastSeen)}
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
        {messages.length === 0 && (
          <p className="text-center text-gray-400 text-sm mt-4">
            No messages yet.
          </p>
        )}

        {messages.map((msg, index) => {
          const senderId =
            typeof msg.sender === "object" ? msg.sender._id : msg.sender;
          const isMe = senderId === userId;
          const senderName = isMe
            ? "You"
            : typeof msg.sender === "object"
              ? msg.sender.name
              : "User";
          const content = msg.message || msg.text || (msg as any).content || "";

          return (
            <div
              key={msg._id || index}
              className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
            >
              <div
                className={`relative px-4 py-2 rounded-2xl max-w-[80%] break-words shadow-sm text-sm ${
                  isMe
                    ? "bg-blue-600 text-white rounded-tr-none"
                    : "bg-white border border-gray-200 text-gray-800 rounded-tl-none"
                }`}
              >
                <p className="pr-4">{content}</p>{" "}
                {/* Pad right for checkmarks */}
                {/* Time & Read Receipts */}
                <div
                  className={`flex items-center justify-end gap-1 mt-1 text-[10px] ${isMe ? "text-blue-100" : "text-gray-400"}`}
                >
                  <span>{msg.createdAt ? formatDate(msg.createdAt) : ""}</span>
                  {isMe && (
                    <span
                      className={
                        msg.isRead ? "text-blue-200 font-bold" : "opacity-70"
                      }
                    >
                      {msg.isRead ? "✓✓" : "✓"}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef}></div>
      </div>

      {/* Input */}
      <div className="p-3 bg-white border-t flex items-center gap-2">
        <input
          type="text"
          placeholder="Type a message..."
          className="flex-1 border border-gray-300 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
        />
        <button
          onClick={handleSend}
          disabled={!newMessage.trim()}
          className={`p-2 rounded-full transition ${
            newMessage.trim()
              ? "bg-blue-600 text-white hover:bg-blue-700 shadow-md transform hover:scale-105"
              : "bg-gray-200 text-gray-400 cursor-not-allowed"
          }`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="w-5 h-5"
          >
            <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default ChatBox;
