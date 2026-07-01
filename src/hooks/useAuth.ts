"use client";

import { useState, useEffect } from "react";

export type Role = "seller" | "delivery" | "buyer" | "admin";

interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  address?: string;
  avatar?: string;
  profilePhoto?: { url: string };
  phone?: string;
  dob?: string | Date;
}

interface AuthResponse {
  success: boolean;
  message?: string;
  data?: {
    user: User;
    token: string;
  };
}

// Helpers for simple obfuscation to hide raw JSON/Tokens in dev tools
const PFX = "enc_";
const encodeData = (str: string) => {
  return PFX + btoa(encodeURIComponent(str));
};
const decodeData = (str: string | null) => {
  if (!str) return null;
  if (str.startsWith(PFX)) {
    try {
      return decodeURIComponent(atob(str.replace(PFX, "")));
    } catch {
      return null;
    }
  }
  return str; // Fallback for legacy plain text data
};

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Load session safely & refresh user data
  useEffect(() => {
    if (typeof window === "undefined") return;

    const rawUser = localStorage.getItem("user");
    const rawToken = localStorage.getItem("token");
    
    const storedUser = decodeData(rawUser);
    const token = decodeData(rawToken);

    if (token) {
        if (storedUser) {
            try { setUser(JSON.parse(storedUser)); } catch (e) {}
        }
        
        // Fetch fresh user data
        fetch("/api/auth/me", {
            headers: { Authorization: `Bearer ${token}` }
        })
        .then(res => res.json())
        .then(data => {
            if (data.success && data.data?.user) {
                const freshUser = { ...data.data.user, role: data.data.user.role.toLowerCase() };
                setUser(freshUser);
                localStorage.setItem("user", encodeData(JSON.stringify(freshUser)));
            } else {
                // Token is invalid, log the user out and redirect
                if (!data.success) {
                    localStorage.clear();
                    setUser(null);
                    window.location.href = "/auth/login";
                }
            }
        })
        .catch(() => {
            // connection error, keep using stored user if any
        })
        .finally(() => setLoading(false));
    } else {
        setLoading(false);
    }
  }, []);

  // ---------------- LOGIN ----------------

  const login = async (
    email: string,
    password: string
  ): Promise<AuthResponse> => {
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data: AuthResponse = await res.json();

      if (data.success && data.data) {
        const normalizedUser = {
          ...data.data.user,
          role: data.data.user.role.toLowerCase() as Role,
        };

        localStorage.setItem("user", encodeData(JSON.stringify(normalizedUser)));
        localStorage.setItem("token", encodeData(data.data.token));

        setUser(normalizedUser);
      }

      return data;
    } catch (err: any) {
      return { success: false, message: err.message || "Login failed" };
    } finally {
      setLoading(false);
    }
  };

  // alias
  const signIn = login;

  // ---------------- REGISTER ----------------

  const register = async (
    name: string,
    email: string,
    phone: string,
    password: string,
    role: Role = "buyer"
  ): Promise<AuthResponse> => {
    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          phone,
          password,
          role: role.toLowerCase(),
        }),
      });

      const data: AuthResponse = await res.json();

      if (data.success && data.data) {
        const normalizedUser = {
          ...data.data.user,
          role: data.data.user.role.toLowerCase() as Role,
        };

        localStorage.setItem("user", encodeData(JSON.stringify(normalizedUser)));
        localStorage.setItem("token", encodeData(data.data.token));

        setUser(normalizedUser);
      }

      return data;
    } catch (err: any) {
      return { success: false, message: err.message || "Registration failed" };
    } finally {
      setLoading(false);
    }
  };

  // ---------------- HELPERS ----------------

  const logout = () => {
    localStorage.clear();
    setUser(null);
  };

  const getToken = () => {
    if (typeof window === "undefined") return null;
    return decodeData(localStorage.getItem("token"));
  };

  const getAuthHeaders = () => {
    const token = getToken();
    const rawUser = localStorage.getItem("user");
    const storedUser = decodeData(rawUser);

    let u = null;
    if (storedUser) {
        try { u = JSON.parse(storedUser); } catch(e) {}
    }

    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      "x-user-id": u?.id || "",
      "x-user-role": u?.role || "",
    };
  };

  const refreshToken = async () => {
    try {
      const res = await fetch("/api/auth/refresh", { method: "POST" });
      const data = await res.json();
      if (data.success && data.data?.accessToken) {
        localStorage.setItem("token", encodeData(data.data.accessToken));
        return { success: true };
      }
      return { success: false, message: data.message || "Session expired" };
    } catch (err: any) {
      return { success: false, message: err.message || "Failed to refresh token" };
    }
  };

  return {
    user,
    loading,
    login,
    signIn,
    register,
    logout,
    getToken,
    getAuthHeaders,
    refreshToken,
  };
}
