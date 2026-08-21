import { createContext, useCallback, useContext, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, BellRing, CheckCircle2, X } from "lucide-react";

const ToastContext = createContext(null);

const ICONS = {
  info: BellRing,
  success: CheckCircle2,
  danger: AlertTriangle,
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const pushToast = useCallback(
    ({ title, message, variant = "info", duration = 5000 }) => {
      const id = Date.now() + Math.random();
      setToasts((prev) => [...prev, { id, title, message, variant }]);
      if (duration) setTimeout(() => removeToast(id), duration);
    },
    [removeToast]
  );

  return (
    <ToastContext.Provider value={{ pushToast }}>
      {children}
      <div className="fixed top-6 right-6 z-[9999] flex flex-col gap-3 w-[340px] max-w-[90vw]">
        <AnimatePresence>
          {toasts.map((t) => {
            const Icon = ICONS[t.variant] || BellRing;
            return (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, x: 60, scale: 0.95 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 60, scale: 0.95 }}
                transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                className="glass-card p-4 flex items-start gap-3 shadow-card-dark"
              >
                <div
                  className={`p-2 rounded-lg shrink-0 ${
                    t.variant === "danger"
                      ? "bg-danger/15 text-danger"
                      : t.variant === "success"
                      ? "bg-success/15 text-success"
                      : "bg-accent-blue/10 text-accent-blue"
                  }`}
                >
                  <Icon size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  {t.title && <p className="text-sm font-semibold leading-tight">{t.title}</p>}
                  <p className="text-xs text-text-secondary mt-0.5 leading-snug">{t.message}</p>
                </div>
                <button
                  onClick={() => removeToast(t.id)}
                  className="text-text-secondary hover:text-text-primary transition-colors shrink-0"
                >
                  <X size={14} />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within a ToastProvider");
  return ctx;
};
