import { Server, Socket } from "socket.io";

/**
 * Handles real-time notifications
 * @param io Socket.io server instance
 * @param socket Connected client socket
 */
export default function notificationSocket(io: Server, socket: Socket) {
  const user = socket.data.user; // { id, role }

  if (!user) return;

  // Join a room for this user to receive personal notifications
  socket.join(user.id);
  console.log(`User ${user.id} joined their notification room`);

  /**
   * Emit a new notification to this user
   * Frontend can listen for 'notification:new'
   */
  socket.on("notification:send", (data: { title: string; body: string }) => {
    if (!data.title || !data.body) return;

    io.to(user.id).emit("notification:new", {
      title: data.title,
      body: data.body,
      timestamp: new Date(),
    });

    console.log(`Sent notification to user ${user.id}: ${data.title}`);
  });

  /**
   * Mark a notification as read
   * Frontend emits 'notification:read' with notificationId
   */
  socket.on("notification:read", (notificationId: string) => {
    if (!notificationId) return;

    io.to(user.id).emit("notification:read:ack", { notificationId });
    console.log(`User ${user.id} read notification ${notificationId}`);
  });

  // Leave notifications room (optional)
  socket.on("notification:leave", () => {
    socket.leave(user.id);
    console.log(`User ${user.id} left their notification room`);
  });

  // Handle disconnect
  socket.on("disconnect", (reason) => {
    console.log(`User ${user.id} disconnected from notifications: ${reason}`);
  });
}
