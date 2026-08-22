import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import http from "http";
import { Server } from "socket.io";
import connectDB from "./config/db.js";
import { startGpsSimulator } from "./utils/gpsSimulator.js";

import authRoutes from "./routes/authRoutes.js";
import vehicleRoutes from "./routes/vehicleRoutes.js";
import driverRoutes from "./routes/driverRoutes.js";
import alertRoutes from "./routes/alertRoutes.js";
import maintenanceRoutes from "./routes/maintenanceRoutes.js";
import geofenceRoutes from "./routes/geofenceRoutes.js";

dotenv.config();
connectDB();

const app = express();

// Restrict CORS to your actual frontend URL(s) via env var (comma-separated allowed)
const allowedOrigins = process.env.CLIENT_URL
  ? process.env.CLIENT_URL.split(",").map((o) => o.trim())
  : ["http://localhost:5173"];

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: allowedOrigins },
});

app.set("io", io);

app.use("/api/auth", authRoutes);
app.use("/api/vehicles", vehicleRoutes);
app.use("/api/drivers", driverRoutes);
app.use("/api/alerts", alertRoutes);
app.use("/api/maintenance", maintenanceRoutes);
app.use("/api/geofences", geofenceRoutes);

app.get("/", (req, res) => {
  res.send("🚍 DashFlee API — Built by Aditya with love ❤️");
});

// ---- 404 handler (unknown routes) ----
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// ---- Global error handler (catches anything thrown/passed via next(err)) ----
app.use((err, req, res, next) => {
  console.error("❌ Unhandled error:", err.stack || err.message);
  res.status(err.status || 500).json({
    message: err.message || "Internal server error",
  });
});

io.on("connection", (socket) => {
  console.log("🔌 Client connected:", socket.id);
  socket.on("disconnect", () => console.log("Client disconnected:", socket.id));
});

startGpsSimulator(io);

const PORT = process.env.PORT || 5001;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
