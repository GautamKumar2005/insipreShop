"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useSocket } from "@/hooks/useSocket";
import { success, error } from "@/lib/response";
import ChatList from "@/components/chat/ChatList";
import Loader from "@/components/ui/Loader";

interface ChatRoom {
  _id: string;
  name: string;
  lastMessage: string;
  updatedAt: string;
}

export default function ChatPage() {
  const { user, token } = useAuth();
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
      console.error("Failed to fetch chat rooms", err);
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
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Chats</h1>

      {rooms.length === 0 ? (
        <p>No chats yet. Start a conversation!</p>
      ) : (
        <ChatList rooms={rooms} />
      )}
    </div>
  );
}
