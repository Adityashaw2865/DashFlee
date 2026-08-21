import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Plus, Wallet, Trash2, X } from "lucide-react";
import API from "../api/axios";
import StatCard from "../components/StatCard";

const TYPE_COLORS = {
  Fuel: "#0A84FF",
  Charging: "#30D158",
  Repair: "#FF453A",
  Service: "#FF9F0A",
  Tyres: "#8891A5",
  Insurance: "#C7C7C7",
  Other: "#5C6370",
};

export default function MaintenanceCosts() {
  const [records, setRecords] = useState([]);
  const [summary, setSummary] = useState({ total: 0, byType: [], byVehicle: [] });
  const [vehicles, setVehicles] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ vehicle: "", type: "Service", description: "", cost: "", odometer: "" });

  const fetchAll = async () => {
    const [{ data: r }, { data: s }, { data: v }] = await Promise.all([
      API.get("/maintenance"),
      API.get("/maintenance/summary"),
      API.get("/vehicles"),
    ]);
    setRecords(r);
    setSummary(s);
    setVehicles(v);
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const addRecord = async () => {
    if (!form.vehicle || !form.cost) return;
    await API.post("/maintenance", { ...form, cost: parseFloat(form.cost), odometer: parseFloat(form.odometer) || 0 });
    setForm({ vehicle: "", type: "Service", description: "", cost: "", odometer: "" });
    setShowForm(false);
    fetchAll();
  };

  const removeRecord = async (id) => {
    await API.delete(`/maintenance/${id}`);
    fetchAll();
  };

  return (
    <div>
      <div className="flex items-start justify-between flex-wrap gap-4">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-display text-2xl font-bold">Cost Tracker</h1>
          <p className="text-text-secondary text-sm mt-1">Fuel, charging &amp; maintenance spend across the fleet.</p>
        </motion.div>
        <button
          onClick={() => setShowForm((s) => !s)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-accent-blue text-bg-primary text-sm font-medium shadow-glow"
        >
          {showForm ? <X size={15} /> : <Plus size={15} />}
          {showForm ? "Cancel" : "Add Record"}
        </button>
      </div>

      {showForm && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="glass-card p-4 mt-4 grid grid-cols-2 md:grid-cols-6 gap-3 items-end"
        >
          <div>
            <label className="text-xs text-text-secondary">Vehicle</label>
            <select
              value={form.vehicle}
              onChange={(e) => setForm({ ...form, vehicle: e.target.value })}
              className="w-full mt-1 px-3 py-2 rounded-lg bg-bg-tertiary border border-border text-sm outline-none focus:border-accent-blue"
            >
              <option value="">Select</option>
              {vehicles.map((v) => (
                <option key={v._id} value={v._id}>
                  {v.vehicleNumber}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-text-secondary">Type</label>
            <select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
              className="w-full mt-1 px-3 py-2 rounded-lg bg-bg-tertiary border border-border text-sm outline-none focus:border-accent-blue"
            >
              {Object.keys(TYPE_COLORS).map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <div className="col-span-2">
            <label className="text-xs text-text-secondary">Description</label>
            <input
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full mt-1 px-3 py-2 rounded-lg bg-bg-tertiary border border-border text-sm outline-none focus:border-accent-blue"
              placeholder="Depot fast-charge"
            />
          </div>
          <div>
            <label className="text-xs text-text-secondary">Cost (₹)</label>
            <input
              value={form.cost}
              onChange={(e) => setForm({ ...form, cost: e.target.value })}
              className="w-full mt-1 px-3 py-2 rounded-lg bg-bg-tertiary border border-border text-sm outline-none focus:border-accent-blue"
              placeholder="850"
            />
          </div>
          <button
            onClick={addRecord}
            className="px-4 py-2 rounded-lg bg-accent-blue text-bg-primary text-sm font-medium h-[38px]"
          >
            Save
          </button>
        </motion.div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        <StatCard icon={Wallet} label="Total Spend" value={Math.round(summary.total)} color="blue" delay={0} suffix=" ₹" />
        <StatCard
          icon={Wallet}
          label="Records Logged"
          value={records.length}
          color="success"
          delay={0.05}
        />
        <StatCard
          icon={Wallet}
          label="Avg Cost / Record"
          value={records.length ? Math.round(summary.total / records.length) : 0}
          color="warning"
          delay={0.1}
          suffix=" ₹"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} className="glass-card p-6 h-80">
          <h2 className="font-display font-semibold mb-4 text-sm">Cost by Type</h2>
          <ResponsiveContainer width="100%" height="85%">
            <PieChart>
              <Pie data={summary.byType} dataKey="total" nameKey="_id" innerRadius={55} outerRadius={85} paddingAngle={4}>
                {summary.byType.map((entry) => (
                  <Cell key={entry._id} fill={TYPE_COLORS[entry._id] || "#8891A5"} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: "var(--bg-secondary)", border: "1px solid var(--border-color)", borderRadius: 12, color: "var(--text-primary)" }} labelStyle={{ color: "var(--text-primary)" }} itemStyle={{ color: "var(--text-primary)" }} />
            </PieChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} className="glass-card p-6 h-80">
          <h2 className="font-display font-semibold mb-4 text-sm">Cost by Vehicle</h2>
          <ResponsiveContainer width="100%" height="85%">
            <BarChart data={summary.byVehicle}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
              <XAxis dataKey="vehicleNumber" tick={{ fontSize: 11, fill: "var(--text-secondary)" }} tickFormatter={(v) => v.slice(-4)} />
              <YAxis tick={{ fontSize: 11, fill: "var(--text-secondary)" }} />
              <Tooltip contentStyle={{ background: "var(--bg-secondary)", border: "1px solid var(--border-color)", borderRadius: 12, color: "var(--text-primary)" }} labelStyle={{ color: "var(--text-primary)" }} itemStyle={{ color: "var(--text-primary)" }} />
              <Bar dataKey="total" fill="var(--accent-blue)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-5 mt-6 overflow-x-auto">
        <h2 className="font-display font-semibold mb-4 text-sm">All Records</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-text-secondary text-xs uppercase">
              <th className="pb-3">Vehicle</th>
              <th className="pb-3">Type</th>
              <th className="pb-3">Description</th>
              <th className="pb-3">Cost</th>
              <th className="pb-3">Date</th>
              <th className="pb-3"></th>
            </tr>
          </thead>
          <tbody>
            {records.map((r) => (
              <tr key={r._id} className="border-t border-border">
                <td className="py-3">{r.vehicle?.vehicleNumber || "—"}</td>
                <td className="py-3">
                  <span
                    className="px-2 py-1 rounded-md text-xs font-medium"
                    style={{ background: `${TYPE_COLORS[r.type]}22`, color: TYPE_COLORS[r.type] }}
                  >
                    {r.type}
                  </span>
                </td>
                <td className="py-3 text-text-secondary">{r.description || "—"}</td>
                <td className="py-3 font-medium">₹{r.cost.toLocaleString()}</td>
                <td className="py-3 text-text-secondary">{new Date(r.date).toLocaleDateString()}</td>
                <td className="py-3">
                  <button onClick={() => removeRecord(r._id)} className="text-text-secondary hover:text-danger">
                    <Trash2 size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </motion.div>
    </div>
  );
}
