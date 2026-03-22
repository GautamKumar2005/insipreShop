"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { 
  Globe, 
  FileText, 
  Video, 
  MessageCircle, 
  Inbox, 
  LayoutDashboard 
} from "lucide-react";
import { useSearchParams } from "next/navigation";

import { Suspense } from "react";

const SocialLayoutInner = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();
  const { user } = useAuth();
  const searchParams = useSearchParams();
  
  const isInbox = pathname === "/social/inbox";
  const isInChat = !!searchParams?.get("user");

  const navItems = [
    { name: "Explore", href: "/social", icon: Globe },
    { name: "Pages", href: "/social/pages", icon: FileText },
    { name: "Reels", href: "/social/reels", icon: Video },
    { name: "Tweets", href: "/social/tweets", icon: MessageCircle },
    { name: "Inbox", href: "/social/inbox", icon: Inbox },
    { name: "Dashboard", href: "/social/dashboard", icon: LayoutDashboard },
  ];

  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-[#050505] flex flex-col md:flex-row">
      <aside className="hidden md:flex fixed left-0 top-0 h-full w-20 md:w-64 border-r border-gray-100 dark:border-gray-900 bg-white dark:bg-[#0a0a0a] z-[100] flex-col p-4 shadow-sm">
        <div className="mb-10 px-2 mt-2">
           <Link href="/" className="text-xl md:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">
             IS
             <span className="hidden md:inline"> Social</span>
           </Link>
        </div>

        <nav className="flex-1 flex flex-col gap-2">
           {navItems.map((item) => {
             const isActive = pathname === item.href;
             const Icon = item.icon;
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
                 <Icon size={20} className={isActive ? 'text-white' : 'text-gray-400 group-hover:text-purple-600'} />
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
                 <p className="text-[10px] text-gray-400 font-medium">@user_{user.id?.slice(-4) || 'XXXX'}</p>
               </div>
            </Link>
          </div>
        )}
      </aside>

      {!isInChat && (
        <nav className="md:hidden fixed bottom-0 left-0 w-full bg-white/95 dark:bg-[#0a0a0a]/95 backdrop-blur-md border-t border-gray-100 dark:border-gray-900 z-[100] px-1 py-1.5 flex items-center justify-around shadow-[0_-5px_20px_-10px_rgba(0,0,0,0.1)]">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link 
                key={item.href} 
                href={item.href}
                className={`flex flex-col items-center gap-1 flex-1 py-1 px-1 rounded-xl transition-all ${
                  isActive ? 'text-purple-600' : 'text-gray-400'
                }`}
              >
                <div className={`p-1.5 rounded-xl transition-all ${isActive ? 'bg-purple-50 dark:bg-purple-900/20' : ''}`}>
                  <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                </div>
                <span className="text-[8px] font-bold uppercase tracking-tight">{item.name}</span>
              </Link>
            );
          })}
        </nav>
      )}

      <main className={`flex-1 md:ml-64 min-h-screen ${isInbox ? 'p-0' : 'py-0 md:py-8 px-0 md:px-4 pb-20 md:pb-8'}`}>
        <div className={`${isInbox ? 'w-full h-screen overflow-hidden' : 'max-w-4xl mx-auto py-8 px-4'}`}>
          {children}
        </div>
      </main>
    </div>
  );
};

const SocialLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-[#fafafa] dark:bg-[#050505]"><div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div></div>}>
      <SocialLayoutInner>{children}</SocialLayoutInner>
    </Suspense>
  );
};

export default SocialLayout;
