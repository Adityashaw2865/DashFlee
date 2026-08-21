import { NavLink } from "react-router-dom";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  MapPin,
  Users,
  BellRing,
  FileBarChart,
  Zap,
  LogOut,
  Sun,
  Moon,
  Wallet,
  TrendingUp,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";

const navItems = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/tracking", icon: MapPin, label: "Live Tracking" },
  { to: "/drivers", icon: Users, label: "Drivers" },
  { to: "/driver-analytics", icon: TrendingUp, label: "Driver Analytics" },
  { to: "/maintenance", icon: Wallet, label: "Cost Tracker" },
  { to: "/alerts", icon: BellRing, label: "Alerts" },
  { to: "/reports", icon: FileBarChart, label: "Reports" },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <motion.aside
      initial={{ x: -60, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="w-64 h-screen sticky top-0 flex flex-col border-r border-border bg-bg-secondary/60 backdrop-blur-xl"
    >
      <div className="flex items-center gap-3 px-6 py-6">
        <div className="p-2 rounded-xl bg-accent-blue/10 text-accent-blue">
          <Zap size={20} />
        </div>
        <div>
          <h1 className="font-display font-bold text-lg leading-none">DashFlee</h1>
          <p className="text-[10px] text-text-secondary mt-0.5">Fleet Control Room</p>
        </div>
      </div>

      <div className="road-divider mx-6" />

      <nav className="flex-1 px-4 py-6 space-y-1.5">
        {navItems.map(({ to, icon: Icon, label }, i) => (
          <motion.div
            key={to}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 + i * 0.06 }}
          >
            <NavLink
              to={to}
              end={to === "/"}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 group ${
                  isActive
                    ? "bg-accent-blue text-bg-primary shadow-glow"
                    : "text-text-secondary hover:bg-bg-tertiary hover:text-text-primary"
                }`
              }
            >
              <Icon size={17} className="group-hover:scale-110 transition-transform" />
              {label}
            </NavLink>
          </motion.div>
        ))}
      </nav>

      <div className="px-4 pb-6 space-y-2">
        <button
          onClick={toggleTheme}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-text-secondary hover:bg-bg-tertiary hover:text-text-primary transition-all"
        >
          {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
          {theme === "dark" ? "Light Mode" : "Dark Mode"}
        </button>

        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-bg-tertiary">
          <div className="w-8 h-8 rounded-full bg-accent-blue/20 text-accent-blue flex items-center justify-center text-xs font-bold">
            {user?.name?.[0] || "A"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold truncate">{user?.name || "Admin"}</p>
            <p className="text-[10px] text-text-secondary truncate">{user?.email}</p>
          </div>
          <button onClick={logout} className="text-text-secondary hover:text-danger transition-colors">
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </motion.aside>
  );
}
