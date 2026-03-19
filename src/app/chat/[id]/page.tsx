"use client";

import { useParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import ChatBox from "@/components/chat/ChatBox";

export default function ChatRoomPage() {
  const { id } = useParams();
  const roomId = Array.isArray(id) ? id[0] : id;
  const { user } = useAuth();

  if (!roomId) return <p className="p-4">Invalid Room</p>;
  if (!user) return <p className="p-4">Loading user...</p>;

  return (
    <div className="flex flex-col h-screen p-4">
      <h1 className="text-2xl font-bold mb-4">Chat Room</h1>
      <div className="flex-1 overflow-hidden">
        <ChatBox roomId={roomId} userId={user.id} />
      </div>
    </div>
  );
}
