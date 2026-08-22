import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Star, Phone, IdCard } from "lucide-react";
import API from "../api/axios";
import StatusBadge from "../components/StatusBadge";
import Loader from "../components/Loader";

export default function Drivers() {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get("/drivers")
      .then((res) => setDrivers(res.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loader label="Loading drivers..." />;

  return (
    <div>
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-display text-2xl font-bold">Drivers</h1>
        <p className="text-text-secondary text-sm mt-1">
          RFID-verified drivers and their vehicle assignments.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 mt-6">
        {drivers.map((d, i) => (
          <motion.div
            key={d._id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06, duration: 0.4 }}
            className="glass-card p-5"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-accent-blue/10 text-accent-blue flex items-center justify-center font-bold font-display">
                  {d.name[0]}
                </div>
                <div>
                  <p className="font-semibold text-sm">{d.name}</p>
                  <div className="flex items-center gap-1 text-warning text-xs mt-0.5">
                    <Star size={11} fill="currentColor" /> {d.rating}
                  </div>
                </div>
              </div>
              <StatusBadge status={d.status} />
            </div>

            <div className="space-y-2 text-xs text-text-secondary">
              <div className="flex items-center gap-2">
                <IdCard size={13} /> {d.rfidId} · {d.licenseNumber}
              </div>
              <div className="flex items-center gap-2">
                <Phone size={13} /> {d.phone}
              </div>
            </div>

            <div className="road-divider my-3" />

            <div className="flex items-center justify-between text-xs">
              <span className="text-text-secondary">{d.experience} yrs experience</span>
              <span className="font-medium">
                {d.assignedVehicle?.vehicleNumber || "No vehicle assigned"}
              </span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
