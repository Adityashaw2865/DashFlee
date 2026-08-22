import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, MapPin, Truck, CheckCircle2 } from "lucide-react";
import API from "../api/axios";
import StatusBadge from "../components/StatusBadge";
import Loader from "../components/Loader";
import { useSocket } from "../hooks/useSocket";

export default function Alerts() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const socketRef = useSocket();

  const fetchAlerts = async (isInitial = false) => {
    const { data } = await API.get("/alerts");
    setAlerts(data);
    if (isInitial) setLoading(false);
  };

  useEffect(() => {
    fetchAlerts(true);
  }, []);

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;
    socket.on("newAlert", () => fetchAlerts(false));
    socket.on("alertUpdated", () => fetchAlerts(false));
    socket.on("alertResolved", () => fetchAlerts(false));
    return () => {
      socket.off("newAlert");
      socket.off("alertUpdated");
      socket.off("alertResolved");
    };
  }, [socketRef.current]);

  const dispatchTeam = async (id) => {
    await API.put(`/alerts/${id}/dispatch`);
    fetchAlerts();
  };

  const resolveAlert = async (id) => {
    await API.put(`/alerts/${id}/resolve`);
    fetchAlerts();
  };

  if (loading) return <Loader label="Loading alerts..." />;

  return (
    <div>
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-display text-2xl font-bold">Alerts & Response</h1>
        <p className="text-text-secondary text-sm mt-1">
          Vehicle damage → alert → dispatch → replacement, in one continuous loop.
        </p>
      </motion.div>

      <div className="space-y-4 mt-6">
        <AnimatePresence>
          {alerts.length === 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card p-8 text-center text-text-secondary text-sm">
              No active alerts. Fleet is running smoothly. ✅
            </motion.div>
          )}
          {alerts.map((a, i) => (
            <motion.div
              key={a._id}
              layout
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: 100 }}
              transition={{ delay: i * 0.05 }}
              className="glass-card p-5"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className={`p-2.5 rounded-xl ${a.status === "Resolved" ? "bg-success/10 text-success" : "bg-danger/10 text-danger"}`}>
                    {a.status === "Resolved" ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{a.vehicle?.vehicleNumber} · {a.type}</p>
                    <p className="text-xs text-text-secondary mt-1 max-w-md">{a.message}</p>
                    <div className="flex items-center gap-1 text-[11px] text-text-secondary mt-2">
                      <MapPin size={11} />
                      {a.location?.lat?.toFixed(4)}, {a.location?.lng?.toFixed(4)}
                    </div>
                  </div>
                </div>
                <StatusBadge status={a.status} />
              </div>

              {a.status !== "Resolved" && (
                <div className="flex gap-2 mt-4 road-divider pt-4">
                  {a.status === "Open" && (
                    <button
                      onClick={() => dispatchTeam(a._id)}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-warning/10 text-warning text-xs font-medium hover:bg-warning/20 transition-colors"
                    >
                      <Truck size={13} /> Dispatch Support Team
                    </button>
                  )}
                  <button
                    onClick={() => resolveAlert(a._id)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-success/10 text-success text-xs font-medium hover:bg-success/20 transition-colors"
                  >
                    <CheckCircle2 size={13} /> Assign Replacement & Resolve
                  </button>
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
