import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { useEffect } from "react";

function Counter({ value }) {
  const count = useMotionValue(0);
  const rounded = useTransform(count, (v) => Math.round(v));

  useEffect(() => {
    const controls = animate(count, value, { duration: 1.2, ease: [0.16, 1, 0.3, 1] });
    return controls.stop;
  }, [value]);

  return <motion.span>{rounded}</motion.span>;
}

export default function StatCard({ icon: Icon, label, value, color = "blue", suffix = "", delay = 0 }) {
  const colorMap = {
    blue: "text-accent-blue bg-accent-blue/10",
    success: "text-success bg-success/10",
    warning: "text-warning bg-warning/10",
    danger: "text-danger bg-danger/10",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="glass-card p-5 shadow-card"
    >
      <div className="flex items-center justify-between mb-3">
        <div className={`p-2.5 rounded-xl ${colorMap[color]}`}>
          <Icon size={18} />
        </div>
      </div>
      <p className="text-2xl font-display font-bold tracking-tight">
        <Counter value={value} />
        {suffix}
      </p>
      <p className="text-xs text-text-secondary mt-1">{label}</p>
    </motion.div>
  );
}
