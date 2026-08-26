import { createContext, useContext, useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { useAuth } from "./AuthContext";
import { useToast } from "./ToastContext";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:5001";

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const { user } = useAuth();
  const { pushToast } = useToast();

  // The socket lives in state, not a ref, so consumers re-render once it exists,
  // and the instance itself is never destroyed — only its connection is toggled.
  //
  // autoConnect: false, because the socket must not dial out before there is a
  // token to hand over. It used to connect on module load, i.e. while the user
  // was still sitting on the login screen.
  //
  // `auth` is a callback rather than a plain object on purpose: Socket.IO calls
  // it before every (re)connection attempt, so a fresh login or a rotated token
  // is picked up automatically without rebuilding the socket.
  const [socket] = useState(() =>
    io(SOCKET_URL, {
      autoConnect: false,
      auth: (cb) => cb({ token: localStorage.getItem("dashflee-token") }),
    })
  );

  // Connect only while there is a session; drop it on logout so the server stops
  // streaming live fleet positions to a browser that no longer has one.
  //
  // A plain disconnect in cleanup is safe here, even though StrictMode runs
  // mount -> cleanup -> mount in dev: the socket *instance* survives, so the
  // second mount simply reconnects it. The original bug was different in kind —
  // it nulled the instance out of a ref, and nothing ever recreated it.
  useEffect(() => {
    if (!user) {
      socket.disconnect();
      return undefined;
    }
    socket.connect();
    return () => socket.disconnect();
  }, [socket, user]);

  // Surface handshake rejections once. Without this, a server that refuses the
  // token just leaves socket.io retrying forever in silence and the dashboard
  // looks frozen with no clue why.
  const warnedRef = useRef(false);

  useEffect(() => {
    const handleConnectError = (err) => {
      console.error("[socket] connection error:", err.message);
      const isAuthFailure = /auth|token|unauthor/i.test(err.message || "");
      if (isAuthFailure && !warnedRef.current) {
        warnedRef.current = true;
        pushToast({
          title: "Live updates unavailable",
          message: "Your session was rejected by the server. Please sign in again.",
          variant: "danger",
        });
      }
    };

    const handleConnect = () => {
      warnedRef.current = false;
    };

    socket.on("connect_error", handleConnectError);
    socket.on("connect", handleConnect);

    return () => {
      socket.off("connect_error", handleConnectError);
      socket.off("connect", handleConnect);
    };
  }, [socket, pushToast]);

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
