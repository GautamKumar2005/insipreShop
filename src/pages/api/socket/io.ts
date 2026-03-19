// Socket.IO Server with Auth Middleware and Debounced Presence Tracking
import { Server as NetServer } from "http";
import { NextApiRequest } from "next";
import { Server as ServerIO } from "socket.io";
import { verifyAccessToken } from "@/lib/jwt";
import User from "@/models/User";
import { connectDB } from "@/lib/db";
import chatSocket from "@/socket/chat.socket";

export const config = {
  api: {
    bodyParser: false,
  },
};

const ioHandler = (req: NextApiRequest, res: any) => {
  if (!res.socket.server.io) {
    console.log("*First use, starting socket.io");

    const httpServer: NetServer = res.socket.server;
    const io = new ServerIO(httpServer, {
      path: "/api/socket/io",
      addTrailingSlash: false,
    });
    
    // Auth Middleware
    io.use(async (socket, next) => {
        try {
            const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(" ")[1];
            if (!token) return next(new Error("Authentication error: No token"));
            
            const decoded: any = verifyAccessToken(token);
            if (!decoded || !decoded.id) return next(new Error("Authentication error: Invalid token"));
            
            socket.data.user = { id: decoded.id, email: decoded.email };
            next();
        } catch (err) {
            next(new Error("Authentication error"));
        }
    });

    // attach timeouts map to server if not exists
    if (!(res.socket.server as any).offlineTimeouts) {
        (res.socket.server as any).offlineTimeouts = new Map();
    }
    const offlineTimeouts = (res.socket.server as any).offlineTimeouts;

    res.socket.server.io = io;

    io.on("connection", async (socket) => {
      await connectDB();
      const userId = socket.data.user?.id;
      
      if (userId) {
          console.log(`User connected: ${userId}`);
          
          // Clear any pending offline timeout
          if (offlineTimeouts.has(userId)) {
              clearTimeout(offlineTimeouts.get(userId));
              offlineTimeouts.delete(userId);
          }
          
          // Mark online
          await User.findByIdAndUpdate(userId, { isOnline: true, lastSeen: new Date() });
          socket.broadcast.emit("user:online", { userId });
          
          socket.on("disconnect", async () => {
             console.log(`User disconnected: ${userId}`);
             
             // Debounce offline update
             const timeout = setTimeout(async () => {
                 await connectDB();
                 await User.findByIdAndUpdate(userId, { isOnline: false, lastSeen: new Date() });
                 socket.broadcast.emit("user:offline", { userId, lastSeen: new Date() });
                 offlineTimeouts.delete(userId);
             }, 3000); // 3 seconds grace
             
             offlineTimeouts.set(userId, timeout);
          });
      }
    });
    
    // Attach functional logic
    chatSocket(io);
  }
  
  res.end();
};

export default ioHandler;
