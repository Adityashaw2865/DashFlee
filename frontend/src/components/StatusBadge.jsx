export default function StatusBadge({ status }) {
  const config = {
    Active: { color: "#30D158", bg: "bg-success/10", text: "text-success" },
    Idle: { color: "#FF9F0A", bg: "bg-warning/10", text: "text-warning" },
    "Under Service": { color: "#FF453A", bg: "bg-danger/10", text: "text-danger" },
    "On Duty": { color: "#30D158", bg: "bg-success/10", text: "text-success" },
    "Off Duty": { color: "#8891A5", bg: "bg-text-secondary/10", text: "text-text-secondary" },
    Open: { color: "#FF453A", bg: "bg-danger/10", text: "text-danger" },
    "In Progress": { color: "#FF9F0A", bg: "bg-warning/10", text: "text-warning" },
    Resolved: { color: "#30D158", bg: "bg-success/10", text: "text-success" },
  };
  const c = config[status] || config.Idle;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${c.bg} ${c.text}`}>
      <span className="status-dot" style={{ background: c.color }} />
      {status}
    </span>
  );
}
