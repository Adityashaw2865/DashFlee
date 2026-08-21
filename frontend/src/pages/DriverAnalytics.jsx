import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
} from "recharts";
import { TrendingUp, Star, ShieldCheck, Clock } from "lucide-react";
import API from "../api/axios";
import StatCard from "../components/StatCard";

export default function DriverAnalytics() {
  const [drivers, setDrivers] = useState([]);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    API.get("/drivers/performance").then((res) => {
      setDrivers(res.data);
      setSelected(res.data[0] || null);
    });
  }, []);

  const avgRating = drivers.length ? (drivers.reduce((s, d) => s + d.rating, 0) / drivers.length).toFixed(2) : 0;
  const avgOnTime = drivers.length ? Math.round(drivers.reduce((s, d) => s + d.onTimePercent, 0) / drivers.length) : 0;
  const totalTrips = drivers.reduce((s, d) => s + d.tripsCompleted, 0);

  const radarData = selected
    ? [
        { metric: "Safety", value: selected.safetyScore },
        { metric: "On-Time", value: selected.onTimePercent },
        { metric: "Rating", value: (selected.rating / 5) * 100 },
        { metric: "Experience", value: Math.min(selected.experience * 10, 100) },
        { metric: "Smoothness", value: Math.max(0, 100 - selected.harshBrakingEvents * 8) },
      ]
    : [];

  return (
    <div>
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-display text-2xl font-bold">Driver Analytics</h1>
        <p className="text-text-secondary text-sm mt-1">Performance, safety, and efficiency across the driver pool.</p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
        <StatCard icon={TrendingUp} label="Total Trips" value={totalTrips} color="blue" delay={0} />
        <StatCard icon={Star} label="Avg Rating" value={avgRating} color="warning" delay={0.05} />
        <StatCard icon={Clock} label="Avg On-Time %" value={avgOnTime} suffix="%" color="success" delay={0.1} />
        <StatCard icon={ShieldCheck} label="Drivers Tracked" value={drivers.length} color="blue" delay={0.15} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="glass-card p-5 h-[420px] overflow-y-auto"
        >
          <h2 className="font-display font-semibold mb-4 text-sm">Drivers</h2>
          <div className="space-y-2.5">
            {drivers.map((d) => (
              <div
                key={d._id}
                onClick={() => setSelected(d)}
                className={`p-3 rounded-xl border cursor-pointer transition-all ${
                  selected?._id === d._id ? "border-accent-blue shadow-glow" : "border-border hover:border-accent-blue/50"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm">{d.name}</span>
                  <span className="text-xs text-warning flex items-center gap-1">
                    <Star size={11} fill="currentColor" /> {d.rating}
                  </span>
                </div>
                <p className="text-xs text-text-secondary mt-1">{d.vehicle} · {d.tripsCompleted} trips</p>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} className="glass-card p-6 h-[420px]">
          <h2 className="font-display font-semibold mb-4 text-sm">
            {selected ? `${selected.name} — Performance Radar` : "Select a driver"}
          </h2>
          <ResponsiveContainer width="100%" height="85%">
            <RadarChart data={radarData}>
              <PolarGrid stroke="var(--border-color)" />
              <PolarAngleAxis dataKey="metric" tick={{ fontSize: 11, fill: "var(--text-secondary)" }} />
              <Radar dataKey="value" stroke="var(--accent-blue)" fill="var(--accent-blue)" fillOpacity={0.3} />
              <Tooltip contentStyle={{ background: "var(--bg-secondary)", border: "1px solid var(--border-color)", borderRadius: 12 }} />
            </RadarChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="glass-card p-6 h-[420px]">
          <h2 className="font-display font-semibold mb-4 text-sm">On-Time % Comparison</h2>
          <ResponsiveContainer width="100%" height="85%">
            <BarChart data={drivers} layout="vertical" margin={{ left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
              <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11, fill: "var(--text-secondary)" }} />
              <YAxis dataKey="name" type="category" width={90} tick={{ fontSize: 11, fill: "var(--text-secondary)" }} />
              <Tooltip contentStyle={{ background: "var(--bg-secondary)", border: "1px solid var(--border-color)", borderRadius: 12 }} />
              <Bar dataKey="onTimePercent" fill="var(--accent-blue)" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-5 mt-6 overflow-x-auto">
        <h2 className="font-display font-semibold mb-4 text-sm">Full Breakdown</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-text-secondary text-xs uppercase">
              <th className="pb-3">Driver</th>
              <th className="pb-3">Vehicle</th>
              <th className="pb-3">Trips</th>
              <th className="pb-3">Rating</th>
              <th className="pb-3">On-Time %</th>
              <th className="pb-3">Safety Score</th>
              <th className="pb-3">Harsh Braking</th>
              <th className="pb-3">Avg Speed</th>
            </tr>
          </thead>
          <tbody>
            {drivers.map((d) => (
              <tr key={d._id} className="border-t border-border">
                <td className="py-3 font-medium">{d.name}</td>
                <td className="py-3 text-text-secondary">{d.vehicle}</td>
                <td className="py-3">{d.tripsCompleted}</td>
                <td className="py-3">{d.rating}</td>
                <td className="py-3">{d.onTimePercent}%</td>
                <td className="py-3">{d.safetyScore}</td>
                <td className="py-3">{d.harshBrakingEvents}</td>
                <td className="py-3">{d.avgSpeed} km/h</td>
              </tr>
            ))}
          </tbody>
        </table>
      </motion.div>
    </div>
  );
}
