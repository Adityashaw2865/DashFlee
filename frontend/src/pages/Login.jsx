import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, Zap, Sun, Moon } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const { login, loading, error } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const ok = await login(email, password);
    if (ok) navigate("/");
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-bg-primary">
      {/* Animated background road lines */}
      <div className="absolute inset-0 opacity-40 pointer-events-none">
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute h-[2px] w-full road-divider"
            style={{ top: `${15 + i * 18}%` }}
            initial={{ x: "-100%" }}
            animate={{ x: "100%" }}
            transition={{ duration: 6 + i, repeat: Infinity, ease: "linear" }}
          />
        ))}
      </div>

      {/* Glow orb */}
      <motion.div
        className="absolute w-[500px] h-[500px] rounded-full blur-3xl opacity-30"
        style={{ background: "var(--accent-blue)" }}
        animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.35, 0.2] }}
        transition={{ duration: 5, repeat: Infinity }}
      />

      <button
        onClick={toggleTheme}
        className="absolute top-6 right-6 z-20 p-3 rounded-full glass-card"
      >
        {theme === "dark" ? <Sun size={18} className="text-accent-amber" /> : <Moon size={18} className="text-accent-blue" />}
      </button>

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-md mx-4"
      >
        <div className="glass-card p-8 shadow-card-dark">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="flex items-center gap-3 mb-1"
          >
            <div className="p-2.5 rounded-xl bg-accent-blue/10 text-accent-blue">
              <Zap size={22} className="animate-drive" />
            </div>
            <h1 className="font-display text-2xl font-bold tracking-tight">DashFlee</h1>
          </motion.div>
          <p className="text-text-secondary text-sm mb-8">
            Real-Time Fleet Monitoring & Management
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-medium text-text-secondary mb-1.5 block">
                Admin Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@dashflee.com"
                className="w-full px-4 py-3 rounded-xl bg-bg-tertiary border border-border text-text-primary text-sm outline-none focus:border-accent-blue focus:shadow-glow transition-all"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-text-secondary mb-1.5 block">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPass ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 rounded-xl bg-bg-tertiary border border-border text-text-primary text-sm outline-none focus:border-accent-blue focus:shadow-glow transition-all pr-11"
                />
                <button
                  type="button"
                  onClick={() => setShowPass((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-accent-blue transition-colors"
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <motion.p
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="text-danger text-xs"
              >
                {error}
              </motion.p>
            )}

            <motion.button
              whileHover={{ scale: 1.015 }}
              whileTap={{ scale: 0.985 }}
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-accent-blue text-bg-primary font-semibold text-sm shadow-glow hover:shadow-lg transition-all disabled:opacity-60"
            >
              {loading ? "Signing in..." : "Sign In to Control Room"}
            </motion.button>
          </form>
        </div>

        <p className="text-center text-xs text-text-secondary mt-6">
          Built by <span className="text-accent-blue font-semibold">Aditya</span> with love ❤️
        </p>
      </motion.div>
    </div>
  );
}
