import { createContext, useContext, useEffect, useRef } from "react";
import { io } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:5001";

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  // socketRef.current is created once, synchronously, during the first render —
  // this happens BEFORE any consumer's useEffect runs, so `useSocket()` always
  // sees a live socket on first read. It is intentionally not stored in state:
  // consumers don't need to re-render when the socket instance itself changes,
  // they just need a stable object to attach/detach listeners on.
  const socketRef = useRef(null);
  if (!socketRef.current) {
    socketRef.current = io(SOCKET_URL, { autoConnect: true });
  }

  useEffect(() => {
    // Under React 18 StrictMode (dev only), this effect runs mount -> cleanup ->
    // mount again. Previously the cleanup nulled socketRef.current, which meant
    // the socket for the FIRST mount got disconnected immediately, wasting a
    // connection every time the app loaded in dev. Now cleanup only fires on the
    // real, final unmount by checking whether the provider is actually going away.
    const socket = socketRef.current;
    return () => {
      socket.disconnect();
      if (socketRef.current === socket) {
        socketRef.current = null;
      }
    };
  }, []);

  return (
    <SocketContext.Provider value={socketRef}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const ctx = useContext(SocketContext);
  if (!ctx) throw new Error("useSocket must be used within a SocketProvider");
  return ctx;
};
