import Vehicle from "../models/Vehicle.js";
import Alert from "../models/Alert.js";
import Geofence from "../models/Geofence.js";

const MAX_HISTORY_POINTS = 200;

// distance in meters between two lat/lng points (haversine)
const distanceMeters = (lat1, lng1, lat2, lng2) => {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

// tracks which vehicles are currently inside which geofences, to detect entry/exit events
const insideZones = new Map(); // vehicleId -> Set(zoneId)

export const startGpsSimulator = (io) => {
  setInterval(async () => {
    try {
      const vehicles = await Vehicle.find({ status: { $ne: "Under Service" } });
      const zones = await Geofence.find({ active: true });

      for (const v of vehicles) {
        if (v.status !== "Active") continue;

        // small random walk to simulate movement
        v.location.lat += (Math.random() - 0.5) * 0.004;
        v.location.lng += (Math.random() - 0.5) * 0.004;
        v.speed = Math.floor(20 + Math.random() * 40); // 20-60 km/h
        v.soc = Math.max(5, v.soc - Math.random() * 0.3); // slowly drains

        // push to location history (capped)
        v.locationHistory.push({
          lat: v.location.lat,
          lng: v.location.lng,
          speed: v.speed,
          soc: v.soc,
          timestamp: new Date(),
        });
        if (v.locationHistory.length > MAX_HISTORY_POINTS) {
          v.locationHistory = v.locationHistory.slice(-MAX_HISTORY_POINTS);
        }

        await v.save();
        io.emit("vehicleUpdate", v);

        // ---- Geofence entry/exit detection ----
        const vId = v._id.toString();
        const prevInside = insideZones.get(vId) || new Set();
        const nowInside = new Set();

        for (const zone of zones) {
          const d = distanceMeters(v.location.lat, v.location.lng, zone.center.lat, zone.center.lng);
          if (d <= zone.radius) nowInside.add(zone._id.toString());
        }

        // exits: zone was in prevInside but not in nowInside
        for (const zoneId of prevInside) {
          if (!nowInside.has(zoneId)) {
            const zone = zones.find((z) => z._id.toString() === zoneId);
            const alert = await Alert.create({
              vehicle: v._id,
              type: "Geofence Breach",
              message: `${v.vehicleNumber} exited geofence "${zone?.name || "zone"}".`,
              location: v.location,
              status: "Open",
            });
            io.emit("newAlert", alert);
          }
        }

        // entries: zone is in nowInside but wasn't in prevInside
        for (const zoneId of nowInside) {
          if (!prevInside.has(zoneId)) {
            const zone = zones.find((z) => z._id.toString() === zoneId);
            const alert = await Alert.create({
              vehicle: v._id,
              type: "Geofence Entry",
              message: `${v.vehicleNumber} entered geofence "${zone?.name || "zone"}".`,
              location: v.location,
              status: "Open",
            });
            io.emit("newAlert", alert);
          }
        }

        insideZones.set(vId, nowInside);

        // ---- Low SoC micro alert (occasional) ----
        if (v.soc < 15 && Math.random() < 0.05) {
          const alert = await Alert.create({
            vehicle: v._id,
            type: "Low SoC",
            message: `${v.vehicleNumber} battery critically low (${Math.round(v.soc)}%).`,
            location: v.location,
            status: "Open",
          });
          io.emit("newAlert", alert);
        }
      }
    } catch (err) {
      console.error("GPS Simulator error:", err.message);
    }
  }, 3000);
};
