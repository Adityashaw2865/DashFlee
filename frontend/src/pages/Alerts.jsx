import { useCallback, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, MapPin, Truck, CheckCircle2 } from "lucide-react";
import API from "../api/axios";
import StatusBadge from "../components/StatusBadge";
import Loader from "../components/Loader";
import { useSocket } from "../hooks/useSocket";
import { useToast } from "../context/ToastContext";

// The simulator can generate alerts indefinitely and GET /alerts has no
// pagination, so cap what we hold in memory to keep long sessions responsive.
const MAX_ALERTS = 200;

// Alerts reach us in two different shapes: GET /alerts populates `vehicle`
// ({ vehicleNumber, location }), while the socket emits the freshly created
// document where `vehicle` is still a bare ObjectId. Handle both.
const vehicleLabel = (ref, vehicleMap) => {
  if (!ref) return "Unknown vehicle";
  if (typeof ref === "object") return ref.vehicleNumber || "Unknown vehicle";
  return vehicleMap.get(ref)?.vehicleNumber || "Unknown vehicle";
};

export default function Alerts() {
  const [alerts, setAlerts] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [replacements, setReplacements] = useState({}); // alertId -> vehicleId
  const [busyId, setBusyId] = useState(null);
  const [loading, setLoading] = useState(true);
  const socket = useSocket();
  const { pushToast } = useToast();

  const notifyError = useCallback(
    (title, err) =>
      pushToast({
        title,
        message: err.response?.data?.message || err.message,
        variant: "danger",
      }),
    [pushToast]
  );

  const fetchAll = useCallback(
    async (isInitial = false) => {
      if (isInitial) setLoading(true);
      try {
        const [alertsRes, vehiclesRes] = await Promise.all([
          API.get("/alerts"),
          API.get("/vehicles"),
        ]);
        setAlerts(alertsRes.data.slice(0, MAX_ALERTS));
        setVehicles(vehiclesRes.data);
      } catch (err) {
        notifyError("Could not load alerts", err);
      } finally {
        if (isInitial) setLoading(false);
      }
    },
    [notifyError]
  );

  useEffect(() => {
    fetchAll(true);
  }, [fetchAll]);

  useEffect(() => {
    // Patch state from the event payload instead of refetching the entire list.
    // With the simulator emitting geofence alerts every few seconds, the old
    // fetchAll()-on-every-event approach meant a constant stream of full reloads.
    const upsert = (incoming) => {
      if (!incoming?._id) return;
      setAlerts((prev) => {
        const idx = prev.findIndex((a) => a._id === incoming._id);
        if (idx === -1) return [incoming, ...prev].slice(0, MAX_ALERTS);
        const next = [...prev];
        next[idx] = { ...next[idx], ...incoming };
        return next;
      });
    };

    socket.on("newAlert", upsert);
    socket.on("alertUpdated", upsert);
    socket.on("alertResolved", upsert);
    return () => {
      socket.off("newAlert", upsert);
      socket.off("alertUpdated", upsert);
      socket.off("alertResolved", upsert);
    };
  }, [socket]);

  const vehicleMap = useMemo(() => new Map(vehicles.map((v) => [v._id, v])), [vehicles]);

  // A sensible replacement is any idle vehicle other than the one that faulted.
  const availableFor = (alert) =>
    vehicles.filter(
      (v) => v.status === "Idle" && v._id !== (alert.vehicle?._id || alert.vehicle)
    );

  const dispatchTeam = async (id) => {
    setBusyId(id);
    try {
      const { data } = await API.put(`/alerts/${id}/dispatch`);
      setAlerts((prev) => prev.map((a) => (a._id === id ? { ...a, ...data } : a)));
    } catch (err) {
      notifyError("Could not dispatch team", err);
    } finally {
      setBusyId(null);
    }
  };

  const resolveAlert = async (id) => {
    setBusyId(id);
    try {
      // This is what was missing: the button read "Assign Replacement & Resolve"
      // but sent no body at all, so replacementAssigned was never set on any alert.
      const replacementVehicleId = replacements[id] || undefined;
      const { data } = await API.put(`/alerts/${id}/resolve`, { replacementVehicleId });
      setAlerts((prev) => prev.map((a) => (a._id === id ? { ...a, ...data } : a)));
      pushToast({
        title: "Alert resolved",
        message: replacementVehicleId
          ? `Replacement ${vehicleMap.get(replacementVehicleId)?.vehicleNumber || ""} assigned.`
          : "Resolved without a replacement vehicle.",
        variant: "success",
      });
    } catch (err) {
      notifyError("Could not resolve alert", err);
    } finally {
      setBusyId(null);
    }
  };

  if (loading) return <Loader label="Loading alerts..." />;

  return (
    <div>
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-display text-2xl font-bold">Alerts &amp; Response</h1>
        <p className="text-text-secondary text-sm mt-1">
          Vehicle damage → alert → dispatch → replacement, in one continuous loop.
        </p>
      </motion.div>

      <div className="space-y-4 mt-6">
        <AnimatePresence>
          {alerts.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="glass-card p-8 text-center text-text-secondary text-sm"
            >
              No active alerts. Fleet is running smoothly. ✅
            </motion.div>
          )}
          {alerts.map((a) => {
            const options = availableFor(a);
            const busy = busyId === a._id;
            return (
              <motion.div
                key={a._id}
                layout
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: 100 }}
                className="glass-card p-5"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div
                      className={`p-2.5 rounded-xl ${
                        a.status === "Resolved"
                          ? "bg-success/10 text-success"
                          : "bg-danger/10 text-danger"
                      }`}
                    >
                      {a.status === "Resolved" ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
                    </div>
                    <div>
                      <p className="font-semibold text-sm">
                        {vehicleLabel(a.vehicle, vehicleMap)} · {a.type}
                      </p>
                      <p className="text-xs text-text-secondary mt-1 max-w-md">{a.message}</p>
                      <div className="flex items-center gap-1 text-[11px] text-text-secondary mt-2">
                        <MapPin size={11} />
                        {a.location?.lat?.toFixed(4) ?? "—"}, {a.location?.lng?.toFixed(4) ?? "—"}
                      </div>
                      {a.replacementAssigned && (
                        <p className="text-[11px] text-success mt-1.5">
                          Replacement: {vehicleLabel(a.replacementAssigned, vehicleMap)}
                        </p>
                      )}
                    </div>
                  </div>
                  <StatusBadge status={a.status} />
                </div>

                {a.status !== "Resolved" && (
                  <div className="flex items-center gap-2 mt-4 road-divider pt-4 flex-wrap">
                    {a.status === "Open" && (
                      <button
                        onClick={() => dispatchTeam(a._id)}
                        disabled={busy}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-warning/10 text-warning text-xs font-medium hover:bg-warning/20 transition-colors disabled:opacity-40"
                      >
                        <Truck size={13} /> Dispatch Support Team
                      </button>
                    )}

                    <select
                      value={replacements[a._id] || ""}
                      onChange={(e) =>
                        setReplacements((prev) => ({ ...prev, [a._id]: e.target.value }))
                      }
                      disabled={busy || options.length === 0}
                      className="px-3 py-2 rounded-lg bg-bg-tertiary border border-border text-xs outline-none focus:border-accent-blue disabled:opacity-40"
                    >
                      <option value="">
                        {options.length === 0 ? "No idle vehicle free" : "Replacement (optional)"}
                      </option>
                      {options.map((v) => (
                        <option key={v._id} value={v._id}>
                          {v.vehicleNumber}
                        </option>
                      ))}
                    </select>

                    <button
                      onClick={() => resolveAlert(a._id)}
                      disabled={busy}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-success/10 text-success text-xs font-medium hover:bg-success/20 transition-colors disabled:opacity-40"
                    >
                      <CheckCircle2 size={13} />
                      {replacements[a._id] ? "Assign Replacement & Resolve" : "Resolve"}
                    </button>
                  </div>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
