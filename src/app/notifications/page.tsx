"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { NotificationItem } from "@/components/notification/NotificationItem";
import Loader from "@/components/ui/Loader";

interface Notification {
  _id: string;
  title: string;
  body: string;
  isRead: boolean;
  createdAt: string;
}

export default function NotificationsPage() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch notifications
  const fetchNotifications = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/notifications`, {
        headers: { "x-user-id": user.id },
      });
      const data = await res.json();
      if (data.success) setNotifications(data.data);
    } catch (err) {
      console.error("Failed to fetch notifications", err);
    } finally {
      setLoading(false);
    }
  };

  // Mark a notification as read
  const markAsRead = async (id: string) => {
    try {
      const res = await fetch(`/api/notifications/read`, {
        method: "POST",
        headers: { "x-user-id": user?.id || "", "Content-Type": "application/json" },
        body: JSON.stringify({ notificationId: id }),
      });
      const data = await res.json();
      if (data.success) fetchNotifications(); // refresh list
    } catch (err) {
      console.error("Failed to mark notification as read", err);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [user]);

  if (loading) return <Loader />;

  if (!notifications.length) return <p className="p-4">No notifications found.</p>;

  return (
    <div className="p-4 space-y-2">
      <h1 className="text-2xl font-bold mb-4">Notifications</h1>
      {notifications.map((notif) => (
        <NotificationItem
          key={notif._id}
          notification={notif}
          onClick={() => markAsRead(notif._id)}
        />
      ))}
    </div>
  );
}
