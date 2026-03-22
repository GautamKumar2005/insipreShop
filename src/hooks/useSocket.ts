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
      }
      
      if (!isMounted) return;

      socketIo = io(process.env.NEXT_PUBLIC_SOCKET_URL || "", {
        path: "/api/socket/io",
        addTrailingSlash: false,
        auth: { token },
        transports: ["websocket", "polling"],
      });

      socketIo.on("connect", () => {
      });

      socketIo.on("disconnect", (reason) => {
      });

      socketIo.on("connect_error", (err: any) => {
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

  const on = (event: string, callback: (...args: any[]) => void) => {
    socket?.on(event, callback);
  };

  const off = (event: string, callback: (...args: any[]) => void) => {
    socket?.off(event, callback);
  };

  return { socket, on, off };
}
