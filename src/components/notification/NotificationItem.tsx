"use client";

import React from "react";
import { Notification } from "@/hooks/useNotification";
import { formatDate } from "@/utils/date";

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
}

const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  onMarkAsRead,
}) => {
  const isUnread = !notification.isRead;

  return (
    <div
      className={`p-4 border-b flex justify-between items-center ${
        isUnread ? "bg-blue-50" : "bg-white"
      }`}
    >
      <div>
        <p className="font-semibold">{notification.title}</p>
        <p className="text-sm text-gray-600">{notification.body}</p>
        <p className="text-xs text-gray-400">
          {formatDate(notification.createdAt)}
        </p>
      </div>
      {isUnread && (
        <button
          onClick={() => onMarkAsRead(notification._id)}
          className="px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
        >
          Mark as Read
        </button>
      )}
    </div>
  );
};

export default NotificationItem;
