import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Car, Activity, PauseCircle, Wrench, BatteryMedium } from "lucide-react";
import API from "../api/axios";
import StatCard from "../components/StatCard";
import StatusBadge from "../components/StatusBadge";
import Loader from "../components/Loader";
import { useSocket } from "../hooks/useSocket";

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const socketRef = useSocket();

  const fetchData = async (isInitial = false) => {
    if (isInitial) setLoading(true);
    try {
      const [statsRes, vehiclesRes] = await Promise.all([
        API.get("/vehicles/stats"),
        API.get("/vehicles"),
      ]);
      setStats(statsRes.data);
      setVehicles(vehiclesRes.data);
    } finally {
      if (isInitial) setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(true);
  }, []);

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;
    socket.on("vehicleUpdate", () => fetchData(false));
    socket.on("newAlert", () => fetchData(false));
    return () => {
      socket.off("vehicleUpdate");
      socket.off("newAlert");
    };
  }, [socketRef.current]);

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
        <StatCard icon={Car} label="Total Fleet" value={stats?.total || 0} color="blue" delay={0} />
        <StatCard icon={Activity} label="Active" value={stats?.active || 0} color="success" delay={0.05} />
        <StatCard icon={PauseCircle} label="Idle" value={stats?.idle || 0} color="warning" delay={0.1} />
        <StatCard icon={Wrench} label="Under Service" value={stats?.underService || 0} color="danger" delay={0.15} />
        <StatCard icon={BatteryMedium} label="Avg. SoC" value={stats?.avgSoc || 0} suffix="%" color="blue" delay={0.2} />
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
