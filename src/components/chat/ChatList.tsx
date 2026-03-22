"use client";

import React from "react";
import Link from "next/link";
import { formatDate } from "@/utils/date";

interface ChatRoom {
  _id: string;
  name: string;
  lastMessage: string;
  updatedAt: string;
}

interface ChatListProps {
  rooms: ChatRoom[];
}

const ChatList: React.FC<ChatListProps> = ({ rooms }) => {
  return (
    <div className="flex flex-col gap-4">
      {rooms.map((room) => (
        <Link
          key={room._id}
          href={`/chat/${room._id}`}
          className="group flex items-center gap-4 p-5 md:p-6 bg-white dark:bg-[#0a0a0a] border border-gray-100 dark:border-white/5 rounded-[1.8rem] hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] active:scale-95 shadow-lg shadow-black/5"
        >
          <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 flex items-center justify-center text-white font-black text-lg shadow-md group-hover:rotate-12 transition-transform duration-500">
             {room.name[0].toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-start mb-1">
              <h3 className="font-black text-gray-900 dark:text-gray-100 text-lg md:text-xl tracking-tighter truncate pr-4">
                {room.name}
              </h3>
              <span className="text-[10px] md:text-[11px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">
                {formatDate(room.updatedAt)}
              </span>
            </div>
            <p className="text-sm md:text-md text-gray-500 dark:text-gray-400 font-medium truncate line-clamp-1 opacity-80">
              {room.lastMessage || "Start a new conversation..."}
            </p>
          </div>
          <div className="text-gray-300 group-hover:text-purple-500 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
          </div>
        </Link>
      ))}
    </div>
  );
};

export default ChatList;
