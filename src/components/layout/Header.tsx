"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { usePathname, useRouter } from "next/navigation";
import { ROLES } from "@/lib/constants";

const Header = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const { user } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const isHomePage = pathname === "/";

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mobile menu when route changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  return (
    <header className="top-0 w-full z-50 transition-all duration-300 sticky bg-white/80 dark:bg-gray-900/80 backdrop-blur-md shadow-md py-3 text-gray-900 dark:text-gray-100">
      <div className="container mx-auto px-4 flex items-center justify-between">
        <Link
          href={
            user?.role === ROLES.ADMIN
              ? "/admin/dashboard"
              : user?.role === ROLES.SELLER
                ? "/seller/dashboard"
                : user?.role === ROLES.DELIVERY
                  ? "/delivery/dashboard"
                  : "/"
          }
          className="text-xl md:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 transition-all hover:scale-105 active:scale-95 flex-shrink-0"
        >
          InspireShop
        </Link>

        {/* Desktop Nav */}
        {(!pathname || !pathname.startsWith("/social")) && (
          <nav className="hidden md:flex items-center gap-8 ml-auto">
            {(!user || user.role === ROLES.BUYER) && (
              <div className="relative group">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const query = (e.target as any).search.value;
                    if (query.trim()) {
                      router.push(
                        `/products?search=${encodeURIComponent(query)}`,
                      );
                    }
                  }}
                  className="flex items-center bg-gray-100/50 rounded-full px-3 py-1 focus-within:ring-2 ring-purple-500/20 transition-all"
                >
                  <input
                    name="search"
                    type="text"
                    placeholder="Search products..."
                    className="bg-transparent border-none outline-none text-sm w-32 focus:w-48 transition-all duration-300 placeholder:text-gray-400"
                  />
                  <button
                    type="submit"
                    className="ml-2 text-gray-500 hover:text-purple-600"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <circle cx="11" cy="11" r="8" />
                      <path d="m21 21-4.3-4.3" />
                    </svg>
                  </button>
                </form>
              </div>
            )}

            <Link
              href={
                user?.role === ROLES.ADMIN
                  ? "/admin/dashboard"
                  : user?.role === ROLES.SELLER
                    ? "/seller/dashboard"
                    : user?.role === ROLES.DELIVERY
                      ? "/delivery/dashboard"
                      : "/"
              }
              className="text-sm font-medium hover:text-purple-600 transition-all relative group"
            >
              Home
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-purple-600 to-pink-600 transition-all group-hover:w-full"></span>
            </Link>

            <Link
              href="/profile"
              className="text-sm font-medium hover:text-purple-600 transition-all relative group"
            >
              Profile
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-purple-600 to-pink-600 transition-all group-hover:w-full"></span>
            </Link>

            <Link
              href="/social"
              className="text-sm font-medium hover:text-purple-600 transition-all relative group"
            >
              Social
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-purple-600 to-pink-600 transition-all group-hover:w-full"></span>
            </Link>

            {(!user || user.role === ROLES.BUYER) && (
              <Link
                href="/cart"
                className="text-sm font-medium hover:text-purple-600 transition-all relative group"
              >
                Cart
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-purple-600 to-pink-600 transition-all group-hover:w-full"></span>
              </Link>
            )}

            {!user ? (
              <div className="flex items-center gap-4 ml-4">
                <Link
                  href="/auth/login"
                  className="text-sm font-medium hover:text-purple-600 transition-colors"
                >
                  Login
                </Link>
                <Link
                  href="/auth/register"
                  className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-full hover:bg-purple-700 transition-all shadow-md hover:shadow-lg"
                >
                  Join Us
                </Link>
              </div>
            ) : (
              <button
                onClick={() => {
                  window.location.href = "/profile";
                }}
                className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-bold ml-4"
              >
                {user.name?.[0]?.toUpperCase() || "U"}
              </button>
            )}
          </nav>
        )}

        <div className="flex items-center gap-1 sm:gap-2">
          {/* Mobile controls: Search & Hamburger */}
          {(!pathname || !pathname.startsWith("/social")) && (
            <div className="flex items-center gap-1 md:hidden">
              {(!user || user.role === ROLES.BUYER) && (
                <button
                  className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
                  onClick={() => {
                    setMobileSearchOpen(!mobileSearchOpen);
                    if (mobileMenuOpen) setMobileMenuOpen(false);
                  }}
                  aria-label="Toggle mobile search"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    {mobileSearchOpen ? (
                      <>
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                      </>
                    ) : (
                      <>
                        <circle cx="11" cy="11" r="8"></circle>
                        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                      </>
                    )}
                  </svg>
                </button>
              )}

              <button
                className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
                onClick={() => {
                  setMobileMenuOpen(!mobileMenuOpen);
                  if (mobileSearchOpen) setMobileSearchOpen(false);
                }}
                aria-label="Toggle mobile menu"
              >
                {mobileMenuOpen ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="3" y1="12" x2="21" y2="12"></line>
                    <line x1="3" y1="6" x2="21" y2="6"></line>
                    <line x1="3" y1="18" x2="21" y2="18"></line>
                  </svg>
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Search Dropdown */}
      <div
        className={`md:hidden absolute top-full left-0 w-full bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 shadow-xl transition-all duration-300 ease-in-out overflow-hidden flex flex-col ${
          mobileSearchOpen
            ? "max-h-[100px] opacity-100 py-4"
            : "max-h-0 opacity-0"
        }`}
      >
        <div className="container mx-auto px-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const query = (e.target as any).mobileSearch.value;
              if (query.trim()) {
                router.push(`/products?search=${encodeURIComponent(query)}`);
                setMobileSearchOpen(false);
              }
            }}
            className="flex items-center w-full bg-gray-100/80 dark:bg-gray-800/80 rounded-xl px-4 py-2"
          >
            <input
              name="mobileSearch"
              type="text"
              placeholder="Search products..."
              className="bg-transparent border-none outline-none text-sm w-full placeholder:text-gray-400 dark:text-white"
              autoFocus={mobileSearchOpen}
            />
            <button type="submit" className="text-gray-500">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </button>
          </form>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      <div
        className={`md:hidden absolute top-full left-0 w-full bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 shadow-xl transition-all duration-300 ease-in-out overflow-hidden flex flex-col ${
          mobileMenuOpen
            ? "max-h-[500px] opacity-100 py-4"
            : "max-h-0 opacity-0"
        }`}
      >
        <div className="container mx-auto px-4 flex flex-col gap-4">
          <Link
            href={
              user?.role === ROLES.ADMIN
                ? "/admin/dashboard"
                : user?.role === ROLES.SELLER
                  ? "/seller/dashboard"
                  : user?.role === ROLES.DELIVERY
                    ? "/delivery/dashboard"
                    : "/"
            }
            className="text-base font-semibold p-3 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-xl transition-colors"
          >
            Home
          </Link>

          <Link
            href="/profile"
            className="text-base font-semibold p-3 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-xl transition-colors"
          >
            Profile
          </Link>

          <Link
            href="/social"
            className="text-base font-semibold p-3 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-xl transition-colors"
          >
            Social
          </Link>

          {(!user || user.role === ROLES.BUYER) && (
            <Link
              href="/cart"
              className="text-base font-semibold p-3 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-xl transition-colors"
            >
              Cart
            </Link>
          )}

          <div className="border-t dark:border-gray-800 my-2 pt-2">
            {!user ? (
              <div className="flex flex-col gap-3">
                <Link
                  href="/auth/login"
                  className="w-full text-center p-3 text-base font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl transition-colors"
                >
                  Login
                </Link>
                <Link
                  href="/auth/register"
                  className="w-full text-center p-3 text-base font-semibold text-white bg-purple-600 rounded-xl shadow-md transition-colors hover:bg-purple-700"
                >
                  Join Us
                </Link>
              </div>
            ) : (
              <button
                onClick={() => {
                  window.location.href = "/profile";
                }}
                className="w-full text-center p-3 text-base font-semibold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 rounded-xl transition-colors"
              >
                Go to Dashboard ({user.name})
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
