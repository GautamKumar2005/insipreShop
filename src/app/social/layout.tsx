"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

const SocialLayout = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();
  const { user } = useAuth();
  
  const isInbox = pathname === "/social/inbox";

  const navItems = [
    { name: "Explore", href: "/social" },
    { name: "Pages", href: "/social/pages" },
    { name: "Reels", href: "/social/reels" },
    { name: "Tweets", href: "/social/tweets" },
    { name: "Inbox", href: "/social/inbox" },
    { name: "My Dashboard", href: "/social/dashboard" },
  ];

  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-[#050505] flex">
      {/* Sidebar Navigation */}
      <aside className="fixed left-0 top-0 h-full w-20 md:w-64 border-r border-gray-100 dark:border-gray-900 bg-white dark:bg-[#0a0a0a] z-[100] flex flex-col p-4 shadow-sm">
        <div className="mb-10 px-2 mt-2">
           <Link href="/" className="text-xl md:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">
             IS
             <span className="hidden md:inline"> Social</span>
           </Link>
        </div>

        <nav className="flex-1 flex flex-col gap-2">
           {navItems.map((item) => {
             const isActive = pathname === item.href;
             return (
               <Link 
                 key={item.href} 
                 href={item.href}
                 className={`flex items-center gap-4 p-4 rounded-2xl transition-all duration-300 font-bold group ${
                   isActive 
                     ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20 scale-105' 
                     : 'text-gray-500 hover:bg-purple-50 hover:text-purple-600 dark:hover:bg-purple-900/10'
                 }`}
               >
                 <span className={`w-2 h-2 rounded-full transition-all ${isActive ? 'bg-white scale-100' : 'bg-transparent scale-0 group-hover:scale-100 group-hover:bg-purple-400'}`} />
                 <span className="hidden md:inline">{item.name}</span>
               </Link>
             );
           })}
        </nav>

        {user && (
          <div className="mt-auto border-t border-gray-100 dark:border-gray-900 pt-4 px-2">
            <Link href="/social/dashboard" className="flex items-center gap-4 group">
               <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 font-black border-2 border-white dark:border-gray-800 shadow-sm group-hover:scale-110 transition-transform">
                 {user.name?.[0].toUpperCase()}
               </div>
               <div className="hidden md:block">
                 <p className="font-bold text-sm truncate w-32">{user.name}</p>
                 <p className="text-[10px] text-gray-400 font-medium">@user_{user.id.slice(-4)}</p>
               </div>
            </Link>
          </div>
        )}
      </aside>

      {/* Main Content Area */}
      <main className={`flex-1 ml-20 md:ml-64 min-h-screen ${isInbox ? 'p-0' : 'py-8 px-4'}`}>
        <div className={`${isInbox ? 'w-full h-screen' : 'max-w-4xl mx-auto'}`}>
          {children}
        </div>
      </main>
    </div>
  );
};

export default SocialLayout;
