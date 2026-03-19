"use client";

import { useEffect, useState } from "react";
import { useSocket } from "./useSocket";

export interface Notification {
  _id: string;
  title: string;
  body: string;
  isRead: boolean;
  createdAt: string;
}

export function useNotification(token: string | null) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const { socket, on, off } = useSocket(token);

  useEffect(() => {
    if (!socket) return;

    // Listen for new notifications
    const handleNewNotification = (notification: Notification) => {
      setNotifications((prev) => [notification, ...prev]);
    };

    on("notification", handleNewNotification);

    return () => {
      off("notification", handleNewNotification);
    };
  }, [socket, on, off]);

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
    );
    socket?.emit("notificationRead", { id });
  };

  const addNotification = (notification: Notification) => {
    setNotifications((prev) => [notification, ...prev]);
  };

  return { notifications, markAsRead, addNotification };
}
