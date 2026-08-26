import { createContext, useContext, useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:5001";

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  // The socket lives in state, not a ref, so that consumers actually re-render
  // once it exists. Created lazily on first render and never nulled out —
  // nulling it in cleanup is what previously killed live updates in dev.
  const [socket] = useState(() => io(SOCKET_URL, { autoConnect: true }));

  // StrictMode (dev only) runs effects mount -> cleanup -> mount. We must NOT
  // disconnect on that first synthetic cleanup, because the render body won't
  // run again to recreate the socket. Instead we defer the disconnect to a
  // microtask-free timeout and cancel it if the component remounts, so only a
  // real, final unmount actually tears the connection down.
  const teardownRef = useRef(null);

  useEffect(() => {
    if (teardownRef.current) {
      clearTimeout(teardownRef.current);
      teardownRef.current = null;
    }

    return () => {
      teardownRef.current = setTimeout(() => {
        socket.disconnect();
        teardownRef.current = null;
      }, 0);
    };
  }, [socket]);

  return (
    <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>
  );
};

export const useSocket = () => {
  const ctx = useContext(SocketContext);
  if (ctx === null) {
    throw new Error("useSocket must be used within a SocketProvider");
  }
  return ctx;
};
