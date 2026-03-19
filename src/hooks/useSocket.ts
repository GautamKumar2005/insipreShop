"use client";

import { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";

interface SocketData {
  user: { id: string; role: string };
}

export function useSocket(token: string | null) {
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    if (!token) return;

    let socketIo: Socket | undefined;
    let isMounted = true;

    const initSocket = async () => {
      try {
        await fetch("/api/socket/io");
      } catch (e) {
        console.error("Failed to init socket server", e);
      }
      
      if (!isMounted) return;

      socketIo = io(process.env.NEXT_PUBLIC_SOCKET_URL || "", {
        path: "/api/socket/io",
        addTrailingSlash: false,
        auth: { token },
        transports: ["websocket", "polling"],
      });

      socketIo.on("connect", () => {
        console.log("✅ Socket connected:", socketIo?.id);
      });

      socketIo.on("disconnect", (reason) => {
        console.log("⚡ Socket disconnected:", reason);
      });

      socketIo.on("connect_error", (err: any) => {
        console.error("Socket connect_error:", err.message);
      });
      
      if (isMounted) {
          setSocket(socketIo);
      } else {
          socketIo.disconnect();
      }
    };

    initSocket();

    return () => {
      isMounted = false;
      if (socketIo) {
        socketIo.disconnect();
      }
      setSocket(null);
    };
  }, [token]);

  return { socket };
}
