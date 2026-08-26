import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { useEffect } from "react";

function Counter({ value, decimals = 0 }) {
  const count = useMotionValue(0);

  // Math.round() here is what previously threw away every decimal: an average
  // rating of 4.68 rendered as "5" and an average SoC of 82.5 as "83", which made
  // the .toFixed() work upstream pointless. The caller now decides the precision.
  // Grouping separators keep large figures (total spend, trip counts) readable.
  const display = useTransform(count, (v) =>
    v.toLocaleString("en-IN", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    })
  );

  useEffect(() => {
    // Guard against strings and NaN — several callers pass the result of
    // .toFixed(), which is a string, and a failed computation can yield NaN.
    const target = Number(value);
    const controls = animate(count, Number.isFinite(target) ? target : 0, {
      duration: 1.2,
      ease: [0.16, 1, 0.3, 1],
    });
    return controls.stop;
  }, [count, value]);

  return <motion.span>{display}</motion.span>;
}

export default function StatCard({
  icon: Icon,
  label,
  value,
  color = "blue",
  prefix = "",
  suffix = "",
  decimals = 0,
  delay = 0,
}) {
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
        <div className={`p-2.5 rounded-xl ${colorMap[color] || colorMap.blue}`}>
          {Icon && <Icon size={18} />}
        </div>
      </div>
      <p className="text-2xl font-display font-bold tracking-tight">
        {prefix}
        <Counter value={value} decimals={decimals} />
        {suffix}
      </p>
      <p className="text-xs text-text-secondary mt-1">{label}</p>
    </motion.div>
  );
}
