import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { Download, FileText } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import API from "../api/axios";
import Loader from "../components/Loader";

const COLORS = { Active: "#30D158", Idle: "#FF9F0A", "Under Service": "#FF453A" };

export default function Reports() {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get("/vehicles")
      .then((res) => setVehicles(res.data))
      .finally(() => setLoading(false));
  }, []);

  const statusData = ["Active", "Idle", "Under Service"].map((status) => ({
    name: status,
    value: vehicles.filter((v) => v.status === status).length,
  }));

  const socData = vehicles.map((v) => ({ name: v.vehicleNumber.slice(-4), soc: Math.round(v.soc) }));

  const exportCSV = () => {
    const headers = ["Vehicle Number", "Status", "Driver", "Speed", "SoC", "Last Service"];
    const rows = vehicles.map((v) => [
      v.vehicleNumber,
      v.status,
      v.driver?.name || "Unassigned",
      v.speed,
      Math.round(v.soc),
      new Date(v.lastServiceDate).toLocaleDateString(),
    ]);
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "dashflee_fleet_report.csv";
    a.click();
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("DashFlee — Fleet Report", 14, 18);
    doc.setFontSize(10);
    doc.setTextColor(120);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 25);

    autoTable(doc, {
      startY: 32,
      head: [["Vehicle", "Status", "Driver", "Speed (km/h)", "SoC (%)", "Last Service"]],
      body: vehicles.map((v) => [
        v.vehicleNumber,
        v.status,
        v.driver?.name || "Unassigned",
        v.speed,
        Math.round(v.soc),
        new Date(v.lastServiceDate).toLocaleDateString(),
      ]),
      headStyles: { fillColor: [10, 10, 10] },
      styles: { fontSize: 9 },
    });

    doc.save("dashflee_fleet_report.pdf");
  };

  if (loading) return <Loader label="Loading reports..." />;

  return (
    <div>
      <div className="flex items-center justify-between">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-display text-2xl font-bold">Reports</h1>
          <p className="text-text-secondary text-sm mt-1">Fleet analytics and exportable history.</p>
        </motion.div>
        <div className="flex items-center gap-3">
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={exportCSV}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-accent-blue text-bg-primary text-sm font-medium shadow-glow"
          >
            <Download size={15} /> Export CSV
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={exportPDF}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border text-text-primary text-sm font-medium hover:bg-bg-tertiary transition-colors"
          >
            <FileText size={15} /> Export PDF
          </motion.button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} className="glass-card p-6 h-80">
          <h2 className="font-display font-semibold mb-4 text-sm">Fleet Status Distribution</h2>
          <ResponsiveContainer width="100%" height="85%">
            <PieChart>
              <Pie data={statusData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={4}>
                {statusData.map((entry) => (
                  <Cell key={entry.name} fill={COLORS[entry.name]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: "var(--bg-secondary)", border: "1px solid var(--border-color)", borderRadius: 12, color: "var(--text-primary)" }} labelStyle={{ color: "var(--text-primary)" }} itemStyle={{ color: "var(--text-primary)" }} />
            </PieChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }} className="glass-card p-6 h-80">
          <h2 className="font-display font-semibold mb-4 text-sm">State of Charge by Vehicle</h2>
          <ResponsiveContainer width="100%" height="85%">
            <BarChart data={socData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: "var(--text-secondary)" }} />
              <YAxis tick={{ fontSize: 11, fill: "var(--text-secondary)" }} />
              <Tooltip contentStyle={{ background: "var(--bg-secondary)", border: "1px solid var(--border-color)", borderRadius: 12, color: "var(--text-primary)" }} labelStyle={{ color: "var(--text-primary)" }} itemStyle={{ color: "var(--text-primary)" }} />
              <Bar dataKey="soc" fill="var(--accent-blue)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card mt-6 p-6">
        <h2 className="font-display font-semibold mb-4 text-sm">Vehicle History</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-text-secondary text-xs uppercase border-b border-border">
              <th className="pb-3">Vehicle</th>
              <th className="pb-3">Status</th>
              <th className="pb-3">Last Service</th>
              <th className="pb-3">Docs Valid</th>
            </tr>
          </thead>
          <tbody>
            {vehicles.map((v) => (
              <tr key={v._id} className="border-b border-border/50 last:border-0">
                <td className="py-3 font-medium">{v.vehicleNumber}</td>
                <td className="py-3 text-text-secondary">{v.status}</td>
                <td className="py-3 text-text-secondary">{new Date(v.lastServiceDate).toLocaleDateString()}</td>
                <td className="py-3">{v.documentsValid ? "✅" : "⚠️"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </motion.div>
    </div>
  );
}
