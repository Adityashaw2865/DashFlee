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
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" },
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

io.on("connection", (socket) => {
  console.log("🔌 Client connected:", socket.id);
  socket.on("disconnect", () => console.log("Client disconnected:", socket.id));
});

startGpsSimulator(io);

const PORT = process.env.PORT || 5001;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
