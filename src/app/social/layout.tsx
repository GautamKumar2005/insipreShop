"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { 
  FileText, 
  TrendingUp, 
  LayoutDashboard,
  Search,
  X,
  Sparkles
} from "lucide-react";

const SocialLayoutInner = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  
  const currentSearch = searchParams?.get("search") || "";
  const [searchValue, setSearchValue] = useState(currentSearch);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  useEffect(() => {
    setSearchValue(searchParams?.get("search") || "");
  }, [searchParams]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(window.location.search);
    if (searchValue.trim()) {
      params.set("search", searchValue);
    } else {
      params.delete("search");
    }
    const destPath = pathname?.startsWith("/social/") ? pathname : "/social";
    router.push(`${destPath}?${params.toString()}`);
    setMobileSearchOpen(false);
  };

  const clearSearch = () => {
    setSearchValue("");
    const params = new URLSearchParams(window.location.search);
    params.delete("search");
    router.push(`${pathname || "/social"}?${params.toString()}`);
  };

  const navItems = [
    { name: "Pages", href: "/social", icon: FileText },
    { name: "Trending", href: "/social/trending", icon: TrendingUp },
    { name: "Dashboard", href: "/social/dashboard", icon: LayoutDashboard },
  ];

  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-[#030303] text-gray-900 dark:text-gray-100 flex flex-col">
      {/* Single-row Compact Header */}
      <header className="sticky top-0 z-[110] w-full border-b border-gray-100 dark:border-gray-900 bg-white/80 dark:bg-[#070707]/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 h-12 flex items-center gap-2 sm:gap-3">
          {/* Main → Insipreshop home */}
          <Link href="/" className="shrink-0 text-xs font-bold text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors px-1">
            Main
          </Link>

          <span className="text-gray-200 dark:text-gray-800 select-none">/</span>

          {/* ADS → /social */}
          <Link href="/social" className="flex items-center gap-1.5 shrink-0 group">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-purple-600 to-pink-500 flex items-center justify-center shadow shadow-purple-500/20 group-hover:scale-110 transition-transform">
              <Sparkles size={12} className="text-white" />
            </div>
            <span className="text-sm font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-600">
              ADS
            </span>
          </Link>

          {/* Search — always visible, fills remaining space */}
          <form onSubmit={handleSearchSubmit} className="flex-1 relative group min-w-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-purple-600 transition-colors pointer-events-none" size={14} />
            <input
              type="text"
              placeholder="Search..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              className="w-full h-8 pl-8 pr-7 rounded-full bg-gray-100 dark:bg-[#111] border-none text-xs font-semibold placeholder-gray-400 focus:bg-white dark:focus:bg-[#0a0a0a] focus:ring-2 focus:ring-purple-500 transition-all outline-none"
            />
            {searchValue && (
              <button
                type="button"
                onClick={clearSearch}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
              >
                <X size={12} />
              </button>
            )}
          </form>

          {/* User avatar / login */}
          {user ? (
            <Link href="/social/dashboard" className="flex items-center gap-1.5 shrink-0 group">
              <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-purple-100 to-pink-100 dark:from-purple-900/40 dark:to-pink-900/40 flex items-center justify-center text-purple-600 font-black border border-purple-200 dark:border-purple-800 shadow-sm group-hover:scale-105 transition-all text-xs">
                {user.name?.[0].toUpperCase()}
              </div>
              <span className="hidden sm:inline text-xs font-bold text-gray-600 dark:text-gray-400 group-hover:text-purple-600 transition-colors max-w-[70px] truncate">
                {user.name.split(" ")[0]}
              </span>
            </Link>
          ) : (
            <Link
              href="/auth/login"
              className="shrink-0 text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white px-3 py-1.5 rounded-full transition-all shadow shadow-purple-500/20"
            >
              Login
            </Link>
          )}
        </div>
      </header>


      <div className="flex-1 max-w-7xl w-full mx-auto flex flex-col md:flex-row relative">
        {/* Desktop Sidebar Navigation */}
        <aside className="hidden md:flex w-56 lg:w-64 border-r border-gray-100 dark:border-gray-900 flex-col p-3 lg:p-4 gap-2 h-[calc(100vh-3rem)] sticky top-12 bg-transparent shrink-0">
          <nav className="flex flex-col gap-1 mt-3">
            {navItems.map((item) => {
              const isActive = item.href === "/social"
                ? pathname === "/social" || pathname === "/social/pages"
                : pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 lg:px-4 py-2.5 rounded-2xl transition-all font-bold group ${
                    isActive
                      ? "bg-purple-600 text-white shadow-md shadow-purple-500/20"
                      : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-900 hover:text-purple-600"
                  }`}
                >
                  <Icon size={17} className={isActive ? "text-white" : "text-gray-400 group-hover:text-purple-600 transition-colors"} />
                  <span className="text-sm">{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* Sidebar footer hint */}
          <div className="mt-auto mb-4 p-3 rounded-2xl bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 border border-purple-100 dark:border-purple-900/30">
            <p className="text-[10px] font-black uppercase tracking-widest text-purple-500 mb-1">Pro Tip</p>
            <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed font-medium">
              Connect with sellers to unlock the <strong className="text-purple-600">&quot;My Connections&quot;</strong> feed in ADS.
            </p>
          </div>
        </aside>

        {/* Mobile Bottom Navigation Bar */}
        <nav className="md:hidden fixed bottom-0 left-0 w-full bg-white/95 dark:bg-[#0a0a0a]/95 backdrop-blur-xl border-t border-gray-100/80 dark:border-gray-900/80 z-[100] px-2 py-1 flex items-center justify-around shadow-[0_-8px_30px_-10px_rgba(0,0,0,0.12)] safe-bottom">
          {navItems.map((item) => {
            const isActive = item.href === "/social"
              ? pathname === "/social" || pathname === "/social/pages"
              : pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center gap-0.5 flex-1 py-2 rounded-xl transition-all active:scale-95 ${
                  isActive ? "text-purple-600" : "text-gray-400"
                }`}
              >
                <div className={`p-1.5 rounded-xl transition-all ${isActive ? "bg-purple-100 dark:bg-purple-900/30 scale-110" : ""}`}>
                  <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
                </div>
                <span className={`text-[9px] font-black uppercase tracking-tight transition-all ${isActive ? "text-purple-600" : "text-gray-400"}`}>
                  {item.name}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* Main Content Area */}
        <main className="flex-1 min-h-[calc(100vh-4rem)] px-3 sm:px-4 md:px-6 py-4 md:py-6 pb-24 md:pb-8 overflow-x-hidden">
          <div className="max-w-2xl lg:max-w-3xl mx-auto w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

const SocialLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#030303]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-black uppercase tracking-widest text-gray-400">Loading...</p>
        </div>
      </div>
    }>
      <SocialLayoutInner>{children}</SocialLayoutInner>
    </Suspense>
  );
};

export default SocialLayout;
