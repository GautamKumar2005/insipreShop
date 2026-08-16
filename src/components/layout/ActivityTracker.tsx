"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

export function ActivityTracker() {
  const pathname = usePathname();
  const lastPingRef = useRef<number>(Date.now());

  useEffect(() => {
    if (typeof window === "undefined") return;

    const sendPing = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;

      const now = Date.now();
      const elapsedSeconds = Math.round((now - lastPingRef.current) / 1000);
      if (elapsedSeconds < 5) return; // Prevent spamming duplicate pings

      try {
        await fetch("/api/activity/ping", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            path: pathname,
            duration: elapsedSeconds
          })
        });
        lastPingRef.current = now;
      } catch (err) {
        console.error("Failed to send active session ping:", err);
      }
    };

    // Send a ping immediately on page navigation
    sendPing();

    // Set up heartbeat timer every 30 seconds
    const interval = setInterval(() => {
      sendPing();
    }, 30000);

    return () => {
      clearInterval(interval);
      sendPing();
    };
  }, [pathname]);

  return null;
}
