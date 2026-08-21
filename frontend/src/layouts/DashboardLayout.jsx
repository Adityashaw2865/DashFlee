import { useEffect } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { useSocket } from "../hooks/useSocket";
import { useToast } from "../context/ToastContext";

export default function DashboardLayout() {
  const socketRef = useSocket();
  const { pushToast } = useToast();

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;

    const handleNewAlert = (alert) => {
      pushToast({
        title: alert.type,
        message: alert.message,
        variant: alert.type === "Low SoC" || alert.type === "Damage Detected" ? "danger" : "info",
      });
    };

    socket.on("newAlert", handleNewAlert);
    return () => socket.off("newAlert", handleNewAlert);
  }, [socketRef.current, pushToast]);

  return (
    <div className="flex min-h-screen bg-bg-primary">
      <Sidebar />
      <main className="flex-1 p-8 overflow-x-hidden">
        <Outlet />
      </main>
    </div>
  );
}
