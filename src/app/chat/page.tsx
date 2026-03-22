"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useSocket } from "@/hooks/useSocket";
import { success, error } from "@/lib/response";
import ChatList from "@/components/chat/ChatList";
import { Loader } from "@/components/ui/Loader";

interface ChatRoom {
  _id: string;
  name: string;
  lastMessage: string;
  updatedAt: string;
}

export default function ChatPage() {
  const { user, getToken } = useAuth();
  const token = getToken();
  const { socket } = useSocket(token);

  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch chat rooms
  const fetchChatRooms = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/chat/room", {
        headers: { "x-user-id": user?.id || "" },
      });
      const data = await res.json();
      if (data.success) setRooms(data.data);
    } catch (err) {
          } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChatRooms();
  }, []);

  // Socket: listen for new messages
  useEffect(() => {
    if (!socket) return;

    const handleMessage = (message: any) => {
      setRooms((prev) =>
        prev.map((room) =>
          room._id === message.roomId
            ? {
                ...room,
                lastMessage: message.text,
                updatedAt: message.createdAt,
              }
            : room,
        ),
      );
    };

    socket.on("newMessage", handleMessage);

    return () => {
      socket.off("newMessage", handleMessage);
    };
  }, [socket]);

  if (loading) return <Loader />;

  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-[#080808] p-4 md:p-12 animate-in fade-in duration-1000">
      <div className="max-w-3xl mx-auto">
        <div className="mb-10 text-center md:text-left">
          <h1 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white tracking-tighter uppercase mb-2">Messages</h1>
          <p className="text-xs md:text-sm text-gray-400 font-bold uppercase tracking-widest opacity-60">Your conversations across the platform</p>
        </div>

        {rooms.length === 0 ? (
          <div className="bg-white dark:bg-[#0a0a0a] rounded-[2.5rem] p-12 text-center border border-gray-100 dark:border-white/5 shadow-2xl">
            <div className="w-16 h-16 bg-gray-50 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6 text-gray-300">
               <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14l4-4h10a2 2 0 0 0 2-2Z"/></svg>
            </div>
            <p className="text-xl font-black text-gray-400 uppercase tracking-tight">No chats yet</p>
            <p className="text-sm text-gray-500 mt-2 font-medium">Start a conversation from a product or seller profile!</p>
          </div>
        ) : (
          <ChatList rooms={rooms} />
        )}
      </div>
    </div>
  );
}
