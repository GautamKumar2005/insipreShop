"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import {
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  Mail,
  Phone,
  MapPin,
} from "lucide-react";

export default function Footer() {
  const { user } = useAuth();

  return (
    <footer
      className="text-gray-300 py-12 border-t border-[#09243f]"
      style={{
        backgroundImage:
          "linear-gradient(to bottom, #032962, #002857, #02264b, #09243f, #102133)",
      }}
    >
      <div className="container mx-auto px-6 grid md:grid-cols-4 gap-8">
        {/* Brand & Address */}
        <div>
          <h2 className="text-2xl font-bold text-white mb-4 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-400 w-fit">
            InspireShop
          </h2>
          <div className="flex items-start gap-2 mb-4">
            <MapPin className="w-5 h-5 text-purple-400 mt-1 flex-shrink-0" />
            <p>
              New Delhi, Delhi, India
              <br />
              110001
            </p>
          </div>
          <p className="text-sm opacity-70">
            Inspiring your lifestyle with curated collections and seamless
            shopping experiences.
          </p>
        </div>

        {/* Quick Links */}
        <div>
          <h3 className="text-lg font-semibold text-white mb-4">Account</h3>
          <ul className="space-y-2">
            {!user ? (
              <>
                <li>
                  <Link
                    href="/auth/login"
                    className="hover:text-purple-400 transition-colors"
                  >
                    Login
                  </Link>
                </li>
                <li>
                  <Link
                    href="/auth/register"
                    className="hover:text-purple-400 transition-colors"
                  >
                    Create Account
                  </Link>
                </li>
              </>
            ) : (
              <>
                <li>
                  <Link
                    href="/profile"
                    className="hover:text-purple-400 transition-colors"
                  >
                    My Profile
                  </Link>
                </li>
                <li>
                  <Link
                    href="/social"
                    className="hover:text-purple-400 transition-colors"
                  >
                    Social Hub
                  </Link>
                </li>
                {user.role === "buyer" && (
                  <li>
                    <Link
                      href="/orders"
                      className="hover:text-purple-400 transition-colors"
                    >
                      Order History
                    </Link>
                  </li>
                )}
              </>
            )}
          </ul>
        </div>

        {/* Legal & Policies */}
        <div>
          <h3 className="text-lg font-semibold text-white mb-4">
            Legal & Support
          </h3>
          <ul className="space-y-2">
            <li>
              <Link
                href="/privacy-policy"
                className="hover:text-purple-400 transition-colors"
              >
                Privacy Policy
              </Link>
            </li>
            <li>
              <Link
                href="/terms-conditions"
                className="hover:text-purple-400 transition-colors"
              >
                Terms & Conditions
              </Link>
            </li>
            <li>
              <Link
                href="/return-policy"
                className="hover:text-purple-400 transition-colors"
              >
                Return Policy
              </Link>
            </li>
            <li>
              <Link
                href="/feedback"
                className="hover:text-purple-400 transition-colors"
              >
                Feedback & Complaints
              </Link>
            </li>
          </ul>
        </div>

        {/* Contact Info */}
        <div>
          <h3 className="text-lg font-semibold text-white mb-4">Contact Us</h3>
          <ul className="space-y-4">
            <li className="flex items-center gap-3">
              <Phone className="w-5 h-5 text-purple-400" />
              <span>+91 XXXXX XXXXX</span>
            </li>
            <li className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-purple-400" />
              <a
                href="mailto:support@inspireshop.com"
                className="hover:text-white"
              >
                support@inspireshop.com
              </a>
            </li>
          </ul>
          <div className="flex gap-4 mt-6">
            <Link
              href="#"
              className="p-2 bg-gray-800 rounded-full hover:bg-purple-600 transition-all"
            >
              <Facebook className="w-5 h-5" />
            </Link>
            <Link
              href="#"
              className="p-2 bg-gray-800 rounded-full hover:bg-purple-600 transition-all"
            >
              <Twitter className="w-5 h-5" />
            </Link>
            <Link
              href="#"
              className="p-2 bg-gray-800 rounded-full hover:bg-purple-600 transition-all"
            >
              <Instagram className="w-5 h-5" />
            </Link>
            <Link
              href="#"
              className="p-2 bg-gray-800 rounded-full hover:bg-purple-600 transition-all"
            >
              <Linkedin className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Copyright Bar */}
      <div className="border-t border-gray-800 mt-12 pt-8 flex flex-col md:flex-row items-center justify-between text-sm text-gray-500 gap-4">
        <p>
          &copy; {new Date().getFullYear()} InspireShop. All rights reserved.
          <span className="hidden md:inline mx-2">|</span>
          Made with ❤️ in India
        </p>

      </div>
    </footer>
  );
}
