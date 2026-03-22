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

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Load session safely & refresh user data
  useEffect(() => {
    if (typeof window === "undefined") return;

    const storedUser = localStorage.getItem("user");
    const token = localStorage.getItem("token");

    if (token) {
        if (storedUser) setUser(JSON.parse(storedUser));
        
        // Fetch fresh user data
        fetch("/api/auth/me", {
            headers: { Authorization: `Bearer ${token}` }
        })
        .then(res => res.json())
        .then(data => {
            if (data.success && data.data?.user) {
                const freshUser = { ...data.data.user, role: data.data.user.role.toLowerCase() };
                setUser(freshUser);
                localStorage.setItem("user", JSON.stringify(freshUser));
            } else {
                // Token might be invalid if me fails 401
                if (!data.success) {
                    // Optional: logout() or ignore
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

        localStorage.setItem("user", JSON.stringify(normalizedUser));
        localStorage.setItem("token", data.data.token);

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

        localStorage.setItem("user", JSON.stringify(normalizedUser));
        localStorage.setItem("token", data.data.token);

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
    return localStorage.getItem("token");
  };

  const getAuthHeaders = () => {
    const token = getToken();
    const storedUser = localStorage.getItem("user");

    const u = storedUser ? JSON.parse(storedUser) : null;

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
        localStorage.setItem("token", data.data.accessToken);
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
