import { Server, Socket } from "socket.io";
import Message from "@/models/Message";

export default function chatSocket(io: Server) {
  io.on("connection", (socket: Socket) => {
    
    // Join chat room
    socket.on("joinRoom", (roomId: string) => {
      socket.join(roomId);
      console.log(`User joined room: ${roomId}`);
    });

    // Handle new message
    // Message is already created via API, just broadcast it
    socket.on("sendMessage", (msg: any) => {
       const roomId = msg.roomId || msg.chatRoom;
       if (roomId) {
           // Broadcast to everyone in room (including sender? No, sender already has it)
           // But broadcast excludes sender usually.
           // However, if multiple tabs open for sender?
           // socket.to(roomId).emit("newMessage", msg); 
           // Use broadcast to avoid duplicate on sender's primary tab (which added it locally)
           socket.to(roomId).emit("newMessage", msg);
       }
    });

    socket.on("disconnect", () => {
      // handled in main io file for status
    });
  });
}
