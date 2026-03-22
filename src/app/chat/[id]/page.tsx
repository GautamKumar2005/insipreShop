"use client";

import { useParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import ChatBox from "@/components/chat/ChatBox";

export default function ChatRoomPage() {
  const params = useParams() as { id: string } | null;
  const id = params?.id;
  const roomId = Array.isArray(id) ? id[0] : id;
  const { user } = useAuth();

  if (!roomId) return <p className="p-4">Invalid Room</p>;
  if (!user) return <p className="p-4">Loading user...</p>;

  return (
    <div className="flex flex-col h-screen bg-white dark:bg-black overflow-hidden relative">
      <div className="p-4 border-b md:block hidden bg-white dark:bg-[#0a0a0a]">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Direct Message</h1>
      </div>
      <div className="flex-1 overflow-hidden relative">
        <ChatBox roomId={roomId} userId={user.id} />
      </div>
    </div>
  );
}
