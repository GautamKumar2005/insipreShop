import { Server, Socket } from "socket.io";
import DeliveryProfile from "@/models/DeliveryProfile";

export default function deliverySocket(io: Server) {
  io.on("connection", (socket: Socket) => {
    const { id, role } = socket.data.user;

    // 🚚 Delivery boy sends location
    socket.on("delivery:location", async (location) => {
      if (role !== "delivery") return;

      await DeliveryProfile.findOneAndUpdate(
        { user: id },
        { currentLocation: location }
      );

      socket.broadcast.emit("delivery:location:update", {
        deliveryId: id,
        location,
      });
    });

    // 📦 Order status update
    socket.on("delivery:status", ({ orderId, status }) => {
      io.emit("delivery:status:update", {
        orderId,
        status,
      });
    });

    socket.on("disconnect", () => {});
  });
}
