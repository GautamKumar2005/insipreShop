import { Server } from "socket.io";
import { verifyAccessToken } from "@/lib/jwt";
import chatSocket from "./chat.socket";
import notificationSocket from "./notification.socket";
import deliverySocket from "./delivery.socket";

let io: Server;

export function initSocket(server: any) {
  io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  // 🔐 Socket Auth Middleware
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) return next(new Error("Unauthorized"));

      const decoded: any = verifyAccessToken(token);
      socket.data.user = decoded; // { id, role }
      next();
    } catch {
      next(new Error("Unauthorized"));
    }
  });

  chatSocket(io);
  notificationSocket(io);
  deliverySocket(io);

  return io;
}

export function getIO() {
  if (!io) throw new Error("Socket not initialized");
  return io;
}
