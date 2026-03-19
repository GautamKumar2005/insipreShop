"use client";

import { useTheme } from "next-themes";
import { useEffect, useState, useRef } from "react";
import { Sun, Moon, Monitor } from "lucide-react";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // useEffect only runs on the client, so now we can safely show the UI
  // Without this, we get hydration mismatch because the server doesn't know the theme
  useEffect(() => {
    setMounted(true);
  }, []);

  // Handle clicking outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!mounted) {
    return (
      <button
        className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 animate-pulse"
        aria-label="Loading Theme Toggle"
      ></button>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-purple-500 shadow-sm hover:shadow-md"
        aria-label="Toggle Theme"
      >
        <span className="sr-only">Toggle theme</span>
        <div className="transition-transform duration-300">
          {theme === "light" && <Sun size={20} />}
          {theme === "dark" && <Moon size={20} />}
          {theme === "system" && <Monitor size={20} />}
        </div>
      </button>

      {/* Dropdown Menu */}
      <div
        className={`absolute right-0 mt-3 w-40 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl shadow-xl z-50 origin-top-right transition-all duration-200 ${
          isOpen
            ? "scale-100 opacity-100 translate-y-0 pointer-events-auto"
            : "scale-95 opacity-0 -translate-y-2 pointer-events-none"
        }`}
      >
        <div className="flex flex-col p-1.5 gap-1 text-sm font-medium">
          <button
            onClick={() => {
              setTheme("light");
              setIsOpen(false);
            }}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors duration-200 ${
              theme === "light"
                ? "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-400"
                : "text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800"
            }`}
          >
            <Sun size={18} /> Light
          </button>
          <button
            onClick={() => {
              setTheme("dark");
              setIsOpen(false);
            }}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors duration-200 ${
              theme === "dark"
                ? "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-400"
                : "text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800"
            }`}
          >
            <Moon size={18} /> Dark
          </button>
          <button
            onClick={() => {
              setTheme("system");
              setIsOpen(false);
            }}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors duration-200 ${
              theme === "system"
                ? "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-400"
                : "text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800"
            }`}
          >
            <Monitor size={18} /> System
          </button>
        </div>
      </div>
    </div>
  );
}
