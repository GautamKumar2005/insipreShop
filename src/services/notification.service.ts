import Notification from "@/models/Notification";

export async function sendNotification(
  userId: string,
  title: string,
  body: string
) {
  return Notification.create({
    user: userId,
    title,
    body,
  });
}

export async function getNotifications(userId: string) {
  return Notification.find({ user: userId }).sort({ createdAt: -1 });
}

export async function markAsRead(id: string) {
  return Notification.findByIdAndUpdate(id, { isRead: true });
}
