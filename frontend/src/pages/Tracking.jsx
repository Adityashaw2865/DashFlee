import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { MapContainer, TileLayer, Marker, Popup, Circle, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import { AlertTriangle, Play, Pause, History, ShieldAlert, Plus, X } from "lucide-react";
import API from "../api/axios";
import StatusBadge from "../components/StatusBadge";
import { useSocket } from "../hooks/useSocket";
import { useToast } from "../context/ToastContext";
import Loader from "../components/Loader";

const DEFAULT_CENTER = [22.5726, 88.3639];
const statusColor = { Active: "#30D158", Idle: "#FF9F0A", "Under Service": "#FF453A" };

// Icons are cached per status. Previously makeIcon() built a brand new divIcon
// for every marker on every render, and with a socket tick every few seconds
// that meant continuously discarding and recreating Leaflet DOM icons.
const ICON_CACHE = new Map();
const makeIcon = (status) => {
  if (!ICON_CACHE.has(status)) {
    const color = statusColor[status] || "#0A84FF";
    ICON_CACHE.set(
      status,
      L.divIcon({
        className: "vehicle-marker",
        html: `<div style="
          width:16px;height:16px;border-radius:50%;
          background:${color};
          border:3px solid white; box-shadow:0 0 10px ${color};
        "></div>`,
        iconSize: [16, 16],
      })
    );
  }
  return ICON_CACHE.get(status);
};

const playbackIcon = L.divIcon({
  className: "vehicle-marker",
  html: `<div style="
    width:18px;height:18px;border-radius:50%;
    background:#0A84FF; border:3px solid white; box-shadow:0 0 12px #0A84FF;
  "></div>`,
  iconSize: [18, 18],
});

// Same merge logic as the Dashboard: the socket sends `driver` as a bare
// ObjectId and omits static fields, so replacing the object wholesale wiped the
// driver's name out of the fleet list a few seconds after load.
const mergeVehicleUpdate = (prev, update) => {
  let driver = update.driver;
  if (driver && typeof driver !== "object") {
    driver = prev.driver?._id === driver ? prev.driver : driver;
  }
  return { ...prev, ...update, driver };
};

const hasLocation = (v) =>
  Number.isFinite(v?.location?.lat) && Number.isFinite(v?.location?.lng);

// Fits the viewport to the fleet once, on first load. Without this the map stays
// pinned to a hardcoded Kolkata centre, so once the simulator has walked the
// vehicles a few kilometres away they sit off-screen with no way to find them.
// Deliberately runs only once so it never fights the user's own panning.
function FitToFleet({ vehicles }) {
  const map = useMap();
  const done = useRef(false);

  useEffect(() => {
    if (done.current) return;
    const points = vehicles.filter(hasLocation).map((v) => [v.location.lat, v.location.lng]);
    if (points.length === 0) return;
    done.current = true;
    const bounds = L.latLngBounds(points);
    if (bounds.isValid()) map.fitBounds(bounds, { padding: [40, 40], maxZoom: 13 });
  }, [map, vehicles]);

  return null;
}

export default function Tracking() {
  const [vehicles, setVehicles] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [loading, setLoading] = useState(true);
  const socket = useSocket();
  const { pushToast } = useToast();

  // route playback state
  const [history, setHistory] = useState([]);
  const [playIndex, setPlayIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [followLive, setFollowLive] = useState(false);

  // geofence state
  const [zones, setZones] = useState([]);
  const [showZoneForm, setShowZoneForm] = useState(false);
  const [zoneForm, setZoneForm] = useState({ name: "", lat: "", lng: "", radius: "2000" });

  const notifyError = useCallback(
    (title, err) =>
      pushToast({
        title,
        message: err.response?.data?.message || err.message,
        variant: "danger",
      }),
    [pushToast]
  );

  const fetchVehicles = useCallback(async () => {
    const { data } = await API.get("/vehicles");
    setVehicles(data);
  }, []);

  const fetchZones = useCallback(async () => {
    const { data } = await API.get("/geofences");
    setZones(data);
  }, []);

  useEffect(() => {
    Promise.all([fetchVehicles(), fetchZones()])
      .catch((err) => notifyError("Could not load tracking data", err))
      .finally(() => setLoading(false));
  }, [fetchVehicles, fetchZones, notifyError]);

  useEffect(() => {
    const handleVehicleUpdate = (update) => {
      if (!update?._id) return;

      setVehicles((prev) =>
        prev.map((v) => (v._id === update._id ? mergeVehicleUpdate(v, update) : v))
      );

      // Appending the live point happens here, at the top level of the handler.
      // The previous version called setHistory and setPlayIndex from *inside* a
      // setSelected updater — updater functions must be pure, and StrictMode
      // double-invokes them, so that was live ammunition waiting to go off.
      if (update._id !== selectedId || !update.latestPoint) return;

      setHistory((prev) => {
        const last = prev[prev.length - 1];
        if (last && last.timestamp === update.latestPoint.timestamp) return prev;
        return [...prev, update.latestPoint];
      });
    };

    socket.on("vehicleUpdate", handleVehicleUpdate);
    return () => socket.off("vehicleUpdate", handleVehicleUpdate);
  }, [socket, selectedId]);

  // Derived, not stored. The old code kept a snapshot of the selected vehicle in
  // state and had to manually re-sync it from the socket handler; deriving it
  // means it simply cannot go stale.
  const selected = useMemo(
    () => vehicles.find((v) => v._id === selectedId) || null,
    [vehicles, selectedId]
  );

  const loadHistory = useCallback(
    async (vehicleId) => {
      setSelectedId(vehicleId);
      setPlaying(false);
      setPlayIndex(0);
      setFollowLive(false);
      try {
        const { data } = await API.get(`/vehicles/${vehicleId}/history`);
        setHistory(data.history || []);
      } catch (err) {
        setHistory([]);
        notifyError("Could not load route history", err);
      }
    },
    [notifyError]
  );

  const reportDamage = async (id) => {
    try {
      await API.post(`/vehicles/${id}/report-damage`);
      pushToast({
        title: "Damage reported",
        message: "Vehicle marked Under Service and an alert was raised.",
        variant: "info",
      });
    } catch (err) {
      notifyError("Could not report damage", err);
    }
  };

  // playback ticker
  useEffect(() => {
    if (!playing || history.length === 0) return;
    const interval = setInterval(() => {
      setPlayIndex((i) => {
        if (i >= history.length - 1) {
          setPlaying(false);
          setFollowLive(true); // parked at the newest point — track live from here
          return i;
        }
        return i + 1;
      });
    }, 500);
    return () => clearInterval(interval);
  }, [playing, history.length]);

  const createZone = async () => {
    const name = zoneForm.name.trim();
    const lat = Number(zoneForm.lat);
    const lng = Number(zoneForm.lng);
    const radius = Number(zoneForm.radius);

    // Previously parseFloat("abc") produced NaN, which JSON-serialised to null,
    // which failed Mongoose validation, which returned a 400 that nothing caught.
    // The form just closed and the user was never told anything went wrong.
    if (!name) return pushToast({ title: "Zone name required", message: "Give the zone a name.", variant: "danger" });
    if (!Number.isFinite(lat) || lat < -90 || lat > 90)
      return pushToast({ title: "Invalid latitude", message: "Latitude must be between -90 and 90.", variant: "danger" });
    if (!Number.isFinite(lng) || lng < -180 || lng > 180)
      return pushToast({ title: "Invalid longitude", message: "Longitude must be between -180 and 180.", variant: "danger" });
    if (!Number.isFinite(radius) || radius <= 0)
      return pushToast({ title: "Invalid radius", message: "Radius must be a positive number of metres.", variant: "danger" });

    try {
      await API.post("/geofences", { name, center: { lat, lng }, radius });
      setZoneForm({ name: "", lat: "", lng: "", radius: "2000" });
      setShowZoneForm(false);
      await fetchZones();
      pushToast({ title: "Zone created", message: `"${name}" is now active.`, variant: "success" });
    } catch (err) {
      notifyError("Could not create zone", err);
    }
  };

  const deleteZone = async (id, name) => {
    if (!window.confirm(`Delete geofence "${name}"? This cannot be undone.`)) return;
    try {
      await API.delete(`/geofences/${id}`);
      await fetchZones();
    } catch (err) {
      notifyError("Could not delete zone", err);
    }
  };

  const activeIndex = followLive ? Math.max(0, history.length - 1) : playIndex;
  const trailPositions = history
    .slice(0, activeIndex + 1)
    .filter((h) => Number.isFinite(h?.lat) && Number.isFinite(h?.lng))
    .map((h) => [h.lat, h.lng]);
  const playbackPoint = history[activeIndex];
  const mappableVehicles = vehicles.filter(hasLocation);

  if (loading) return <Loader label="Loading live tracking..." />;

  return (
    <div>
      <div className="flex items-start justify-between flex-wrap gap-4">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-display text-2xl font-bold">Live Tracking</h1>
          <p className="text-text-secondary text-sm mt-1">
            Real-time GPS positions, route playback, and geofence zones.
          </p>
        </motion.div>
        <button
          onClick={() => setShowZoneForm((s) => !s)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-accent-blue text-bg-primary text-sm font-medium shadow-glow"
        >
          {showZoneForm ? <X size={15} /> : <Plus size={15} />}
          {showZoneForm ? "Cancel" : "Add Geofence"}
        </button>
      </div>

      {showZoneForm && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="glass-card p-4 mt-4 grid grid-cols-2 md:grid-cols-5 gap-3 items-end"
        >
          <div className="col-span-2 md:col-span-1">
            <label className="text-xs text-text-secondary">Zone Name</label>
            <input
              value={zoneForm.name}
              onChange={(e) => setZoneForm({ ...zoneForm, name: e.target.value })}
              className="w-full mt-1 px-3 py-2 rounded-lg bg-bg-tertiary border border-border text-sm outline-none focus:border-accent-blue"
              placeholder="Depot Zone"
            />
          </div>
          <div>
            <label className="text-xs text-text-secondary">Latitude</label>
            <input
              type="number"
              step="any"
              value={zoneForm.lat}
              onChange={(e) => setZoneForm({ ...zoneForm, lat: e.target.value })}
              className="w-full mt-1 px-3 py-2 rounded-lg bg-bg-tertiary border border-border text-sm outline-none focus:border-accent-blue"
              placeholder="22.5726"
            />
          </div>
          <div>
            <label className="text-xs text-text-secondary">Longitude</label>
            <input
              type="number"
              step="any"
              value={zoneForm.lng}
              onChange={(e) => setZoneForm({ ...zoneForm, lng: e.target.value })}
              className="w-full mt-1 px-3 py-2 rounded-lg bg-bg-tertiary border border-border text-sm outline-none focus:border-accent-blue"
              placeholder="88.3639"
            />
          </div>
          <div>
            <label className="text-xs text-text-secondary">Radius (m)</label>
            <input
              type="number"
              min="1"
              value={zoneForm.radius}
              onChange={(e) => setZoneForm({ ...zoneForm, radius: e.target.value })}
              className="w-full mt-1 px-3 py-2 rounded-lg bg-bg-tertiary border border-border text-sm outline-none focus:border-accent-blue"
              placeholder="2000"
            />
          </div>
          <button
            onClick={createZone}
            className="px-4 py-2 rounded-lg bg-accent-blue text-bg-primary text-sm font-medium h-[38px]"
          >
            Save Zone
          </button>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-2 glass-card glass-card--static p-3 h-[560px]"
        >
          <MapContainer
            center={DEFAULT_CENTER}
            zoom={12}
            style={{ height: "100%", width: "100%", borderRadius: "16px" }}
          >
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              attribution='&copy; <a href="https://carto.com/attributions">CARTO</a> &copy; OpenStreetMap contributors'
            />
            <FitToFleet vehicles={vehicles} />

            {mappableVehicles.map((v) => (
              <Marker
                key={v._id}
                position={[v.location.lat, v.location.lng]}
                icon={makeIcon(v.status)}
                eventHandlers={{ click: () => loadHistory(v._id) }}
              >
                <Popup>
                  <strong>{v.vehicleNumber}</strong>
                  <br />
                  {v.status} · {v.speed} km/h
                </Popup>
              </Marker>
            ))}

            {zones.map((z) => (
              <Circle
                key={z._id}
                center={[z.center.lat, z.center.lng]}
                radius={z.radius}
                pathOptions={{ color: "#0A84FF", fillOpacity: 0.08, weight: 1.5 }}
              />
            ))}

            {trailPositions.length > 1 && (
              <Polyline positions={trailPositions} pathOptions={{ color: "#0A84FF", weight: 3, opacity: 0.7 }} />
            )}
            {playbackPoint && Number.isFinite(playbackPoint.lat) && (
              <Marker position={[playbackPoint.lat, playbackPoint.lng]} icon={playbackIcon} />
            )}
          </MapContainer>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.15 }}
          className="glass-card p-5 h-[560px] overflow-y-auto"
        >
          <h2 className="font-display font-semibold mb-4">Fleet List</h2>
          <div className="space-y-3">
            {vehicles.map((v) => (
              <div
                key={v._id}
                onClick={() => loadHistory(v._id)}
                className={`p-3 rounded-xl border cursor-pointer transition-all ${
                  selectedId === v._id
                    ? "border-accent-blue shadow-glow"
                    : "border-border hover:border-accent-blue/50"
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-medium text-sm">{v.vehicleNumber}</span>
                  <StatusBadge status={v.status} />
                </div>
                <p className="text-xs text-text-secondary">
                  {v.driver?.name || "Unassigned"} · {v.speed} km/h · SoC {Math.round(v.soc)}%
                </p>
                {v.status !== "Under Service" && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      reportDamage(v._id);
                    }}
                    className="mt-2 flex items-center gap-1.5 text-xs text-danger hover:underline"
                  >
                    <AlertTriangle size={12} /> Simulate Damage
                  </button>
                )}
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {selected && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-5 mt-6"
        >
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <History size={16} className="text-accent-blue" />
              <h2 className="font-display font-semibold text-sm">
                Route Playback — {selected.vehicleNumber}
              </h2>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setFollowLive(false);
                  setPlaying((p) => !p);
                }}
                disabled={history.length === 0}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-accent-blue text-bg-primary text-xs font-medium disabled:opacity-40"
              >
                {playing ? <Pause size={13} /> : <Play size={13} />}
                {playing ? "Pause" : "Play"}
              </button>
              <span className="text-xs text-text-secondary">
                {history.length === 0 ? "No history yet" : `${activeIndex + 1} / ${history.length}`}
              </span>
            </div>
          </div>

          {history.length > 0 && (
            <>
              <input
                type="range"
                min={0}
                max={history.length - 1}
                value={activeIndex}
                onChange={(e) => {
                  const value = Number(e.target.value);
                  setPlaying(false);
                  setPlayIndex(value);
                  // Dragging to the far right means "follow the live edge".
                  setFollowLive(value >= history.length - 1);
                }}
                className="w-full mt-4 accent-accent-blue"
              />
              {playbackPoint && (
                <div className="grid grid-cols-3 gap-4 mt-3 text-xs text-text-secondary">
                  <p>
                    Speed: <span className="text-text-primary font-medium">{playbackPoint.speed} km/h</span>
                  </p>
                  <p>
                    SoC: <span className="text-text-primary font-medium">{Math.round(playbackPoint.soc)}%</span>
                  </p>
                  <p>
                    Time:{" "}
                    <span className="text-text-primary font-medium">
                      {new Date(playbackPoint.timestamp).toLocaleTimeString()}
                    </span>
                  </p>
                </div>
              )}
            </>
          )}
        </motion.div>
      )}

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-5 mt-6">
        <div className="flex items-center gap-2 mb-4">
          <ShieldAlert size={16} className="text-accent-blue" />
          <h2 className="font-display font-semibold text-sm">Geofence Zones</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {zones.map((z) => (
            <div key={z._id} className="p-3 rounded-xl border border-border flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">{z.name}</p>
                <p className="text-xs text-text-secondary">
                  {z.center.lat.toFixed(4)}, {z.center.lng.toFixed(4)} · {(z.radius / 1000).toFixed(1)} km radius
                </p>
              </div>
              <button
                onClick={() => deleteZone(z._id, z.name)}
                className="text-text-secondary hover:text-danger"
              >
                <X size={14} />
              </button>
            </div>
          ))}
          {zones.length === 0 && <p className="text-xs text-text-secondary">No geofence zones yet.</p>}
        </div>
      </motion.div>
    </div>
  );
}
