import { Server, Socket } from "socket.io";

export default function notificationSocket(io: Server) {
  io.on("connection", (socket: Socket) => {
    const userId = socket.data.user.id;

    socket.join(`user_${userId}`);

    socket.on("disconnect", () => {});
  });
}
export function emitNotification(
  io: Server,
  userId: string,
  payload: any
) {
  io.to(`user_${userId}`).emit("notification:new", payload);
}
