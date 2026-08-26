import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Car, Activity, PauseCircle, Wrench, BatteryMedium } from "lucide-react";
import API from "../api/axios";
import StatCard from "../components/StatCard";
import StatusBadge from "../components/StatusBadge";
import Loader from "../components/Loader";
import { useSocket } from "../hooks/useSocket";
import { useToast } from "../context/ToastContext";

const computeStats = (list) => {
  const total = list.length;
  return {
    total,
    active: list.filter((v) => v.status === "Active").length,
    idle: list.filter((v) => v.status === "Idle").length,
    underService: list.filter((v) => v.status === "Under Service").length,
    avgSoc: total
      ? Number((list.reduce((sum, v) => sum + (v.soc || 0), 0) / total).toFixed(1))
      : 0,
  };
};

// The socket payload is deliberately lightweight: it carries live telemetry only,
// and sends `driver` as a bare ObjectId. GET /vehicles, by contrast, returns
// `driver` populated ({ name, rfidId, phone }) plus static fields the socket
// omits entirely (model, rfidTag, lastServiceDate, documentsValid).
// Replacing the whole object with the payload therefore threw all of that away —
// which is why the Driver column flipped to "Unassigned" a few seconds after
// every page load. Merging instead of replacing keeps the populated data.
const mergeVehicleUpdate = (prev, update) => {
  let driver = update.driver;
  if (driver && typeof driver !== "object") {
    // Bare id from the socket: keep the object we already have if it's the same
    // driver, otherwise fall back to the id and let the next refetch resolve it.
    driver = prev.driver?._id === driver ? prev.driver : driver;
  }
  return { ...prev, ...update, driver };
};

export default function Dashboard() {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const socket = useSocket();
  const { pushToast } = useToast();

  const fetchVehicles = useCallback(
    async (isInitial = false) => {
      if (isInitial) setLoading(true);
      try {
        const { data } = await API.get("/vehicles");
        setVehicles(data);
      } catch (err) {
        pushToast({
          title: "Could not load fleet data",
          message: err.response?.data?.message || err.message,
          variant: "danger",
        });
      } finally {
        if (isInitial) setLoading(false);
      }
    },
    [pushToast]
  );

  useEffect(() => {
    fetchVehicles(true);
  }, [fetchVehicles]);

  useEffect(() => {
    const handleVehicleUpdate = (update) => {
      if (!update?._id) return;
      setVehicles((prev) =>
        prev.map((v) => (v._id === update._id ? mergeVehicleUpdate(v, update) : v))
      );
    };

    // A new alert can flip a vehicle to "Under Service" — worth a real refetch.
    const handleNewAlert = () => fetchVehicles(false);

    socket.on("vehicleUpdate", handleVehicleUpdate);
    socket.on("newAlert", handleNewAlert);
    return () => {
      socket.off("vehicleUpdate", handleVehicleUpdate);
      socket.off("newAlert", handleNewAlert);
    };
  }, [socket, fetchVehicles]);

  // Derived during render instead of being pushed into state from inside a
  // setVehicles updater. Updater functions must be pure — calling another
  // setter from inside one is the kind of thing StrictMode double-invokes and
  // punishes, and it also let the cards drift out of sync with the table.
  const stats = useMemo(() => computeStats(vehicles), [vehicles]);

  if (loading) return <Loader label="Loading fleet overview..." />;

  return (
    <div>
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-display text-2xl font-bold">Fleet Overview</h1>
        <p className="text-text-secondary text-sm mt-1">
          Real-time status of your public transport fleet, live from the road.
        </p>
      </motion.div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-6">
        <StatCard icon={Car} label="Total Fleet" value={stats.total} color="blue" delay={0} />
        <StatCard icon={Activity} label="Active" value={stats.active} color="success" delay={0.05} />
        <StatCard icon={PauseCircle} label="Idle" value={stats.idle} color="warning" delay={0.1} />
        <StatCard icon={Wrench} label="Under Service" value={stats.underService} color="danger" delay={0.15} />
        <StatCard icon={BatteryMedium} label="Avg. SoC" value={stats.avgSoc} suffix="%" color="blue" delay={0.2} decimals={1} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="glass-card mt-6 p-6"
      >
        <h2 className="font-display font-semibold mb-4">Live Fleet Status</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-text-secondary text-xs uppercase tracking-wide border-b border-border">
                <th className="pb-3 font-medium">Vehicle</th>
                <th className="pb-3 font-medium">Driver</th>
                <th className="pb-3 font-medium">Status</th>
                <th className="pb-3 font-medium">Speed</th>
                <th className="pb-3 font-medium">SoC</th>
              </tr>
            </thead>
            <tbody>
              {vehicles.map((v, i) => (
                <motion.tr
                  key={v._id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 + i * 0.04 }}
                  className="border-b border-border/50 last:border-0 hover:bg-bg-tertiary/50 transition-colors"
                >
                  <td className="py-3.5 font-medium">{v.vehicleNumber}</td>
                  <td className="py-3.5 text-text-secondary">{v.driver?.name || "Unassigned"}</td>
                  <td className="py-3.5"><StatusBadge status={v.status} /></td>
                  <td className="py-3.5 text-text-secondary">{v.speed} km/h</td>
                  <td className="py-3.5">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 rounded-full bg-bg-tertiary overflow-hidden">
                        <motion.div
                          className="h-full rounded-full"
                          style={{ background: v.soc < 20 ? "var(--danger)" : "var(--accent-blue)" }}
                          initial={{ width: 0 }}
                          animate={{ width: `${v.soc}%` }}
                          transition={{ duration: 1 }}
                        />
                      </div>
                      <span className="text-xs text-text-secondary">{Math.round(v.soc)}%</span>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
