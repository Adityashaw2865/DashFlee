import { motion } from "framer-motion";

export default function Loader({ label = "Loading..." }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-24 text-text-secondary">
      <motion.div
        className="w-8 h-8 rounded-full border-2 border-accent-blue border-t-transparent"
        animate={{ rotate: 360 }}
        transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
      />
      <p className="text-xs">{label}</p>
    </div>
  );
}
