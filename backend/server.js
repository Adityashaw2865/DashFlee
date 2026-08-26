import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import http from "http";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
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

const isProduction = process.env.NODE_ENV === "production";

// ---------------------------------------------------------------------------
// Fail fast on missing config.
//
// JWT_SECRET was previously read only at the moment a token was signed or
// verified. If it was absent the server booted looking perfectly healthy, then
// threw on the very first login — or worse, jwt.verify with an undefined secret
// meant every protected route 401'd with no clue why. Crashing at boot with a
// clear message is far kinder than a server that lies about being ready.
// ---------------------------------------------------------------------------
const requiredEnv = ["MONGO_URI", "JWT_SECRET"];
const missingEnv = requiredEnv.filter((key) => !process.env[key]);

if (missingEnv.length > 0) {
  console.error(
    `❌ Missing required environment variables: ${missingEnv.join(", ")}\n` +
      `   Copy .env.example to .env and fill these in before starting the server.`
  );
  process.exit(1);
}

if (process.env.JWT_SECRET.length < 32) {
  const message =
    "JWT_SECRET is shorter than 32 characters — that is brute-forceable. " +
    "Generate one with: node -e \"console.log(require('crypto').randomBytes(48).toString('hex'))\"";
  if (isProduction) {
    console.error(`❌ ${message}`);
    process.exit(1);
  }
  console.warn(`⚠️  ${message}`);
}

const app = express();

// Rate limiting and logging both need the real client IP. Behind Vercel /
// Render / nginx every request arrives from the proxy, so without this the
// limiter would treat the entire internet as a single IP and lock everyone out
// the moment one person retried a login.
app.set("trust proxy", 1);

// Sensible security headers: nosniff, frameguard, HSTS, referrer policy, and it
// drops the X-Powered-By: Express banner that advertises the stack.
app.use(helmet());

// ---------------------------------------------------------------------------
// CORS
//
// localhost:5173 is always allowed outside production. The old behaviour was an
// either/or: setting CLIENT_URL to the deployed Vercel URL silently *replaced*
// the localhost default, so pulling the repo with a populated .env broke local
// development with an opaque CORS error.
// ---------------------------------------------------------------------------
const configuredOrigins = (process.env.CLIENT_URL || "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

const allowedOrigins = isProduction
  ? configuredOrigins
  : [...new Set([...configuredOrigins, "http://localhost:5173", "http://127.0.0.1:5173"])];

if (allowedOrigins.length === 0) {
  console.error("❌ CLIENT_URL must list at least one allowed origin in production.");
  process.exit(1);
}

const corsOptions = {
  origin(origin, callback) {
    // No Origin header means a same-origin, curl, or server-to-server call.
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error(`Origin ${origin} is not allowed by CORS`));
  },
  credentials: true,
};

app.use(cors(corsOptions));

// A 100kb cap. Without a limit, express.json accepts multi-megabyte bodies on
// every unauthenticated endpoint, which is a free memory-exhaustion lever.
app.use(express.json({ limit: "100kb" }));

// ---------------------------------------------------------------------------
// Rate limiting
//
// The login endpoint had none at all: an attacker could grind through a
// password list at whatever rate the network allowed, against bcrypt hashes
// that are only as strong as the password behind them.
// ---------------------------------------------------------------------------
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  skipSuccessfulRequests: true, // only failed attempts count toward the cap
  message: { message: "Too many login attempts. Please try again in 15 minutes." },
});

const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 300,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { message: "Too many requests. Please slow down." },
});

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: allowedOrigins, credentials: true },
});

// ---------------------------------------------------------------------------
// Socket.IO authentication
//
// This was the single widest hole in the app. The socket namespace had no auth
// whatsoever, so anyone who knew the server URL could open a connection from a
// browser console and receive the entire fleet's live GPS coordinates, driver
// assignments, and every alert as it fired — no token, no login, nothing.
//
// The token arrives via handshake.auth.token, which the frontend SocketContext
// now supplies from localStorage on every connection attempt.
// ---------------------------------------------------------------------------
io.use((socket, next) => {
  const token = socket.handshake.auth?.token;

  if (!token) {
    return next(new Error("Authentication required: no token provided"));
  }

  try {
    socket.user = jwt.verify(token, process.env.JWT_SECRET);
    return next();
  } catch {
    return next(new Error("Authentication failed: invalid or expired token"));
  }
});

io.on("connection", (socket) => {
  console.log(`🔌 Client connected: ${socket.id} (user ${socket.user?.id ?? "unknown"})`);
  socket.on("disconnect", (reason) =>
    console.log(`Client disconnected: ${socket.id} (${reason})`)
  );
});

app.set("io", io);

app.get("/", (req, res) => {
  res.send("🚍 DashFlee API — Built by Aditya with love ❤️");
});

// Readiness probe that reports the truth. Returns 503 while Mongo is down, so a
// platform health check can tell "process alive" from "actually able to serve".
app.get("/health", (req, res) => {
  const dbUp = mongoose.connection.readyState === 1;
  res.status(dbUp ? 200 : 503).json({
    status: dbUp ? "ok" : "degraded",
    database: dbUp ? "connected" : "disconnected",
    uptime: Math.round(process.uptime()),
  });
});

app.use("/api", apiLimiter);
app.use("/api/auth/login", authLimiter);
app.use("/api/auth/register", authLimiter);

app.use("/api/auth", authRoutes);
app.use("/api/vehicles", vehicleRoutes);
app.use("/api/drivers", driverRoutes);
app.use("/api/alerts", alertRoutes);
app.use("/api/maintenance", maintenanceRoutes);
app.use("/api/geofences", geofenceRoutes);

// ---- 404 handler (unknown routes) ----
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// ---------------------------------------------------------------------------
// Global error handler.
//
// Express identifies this as an error handler by its arity, so all four
// parameters must stay even though `next` is unused.
//
// It used to echo err.message straight back to the client on a 500. Mongoose
// and MongoDB driver errors are chatty — they name collections, fields, index
// names, and sometimes the connection string's host — so an unexpected crash
// handed an attacker a free schema tour. Deliberate errors (those carrying a
// 4xx status) are still surfaced, because those messages are ours and are
// meant to be read.
// ---------------------------------------------------------------------------
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  const status = err.status || err.statusCode || 500;

  console.error("❌ Unhandled error:", err.stack || err.message);

  const isClientError = status >= 400 && status < 500;
  res.status(status).json({
    message: isClientError ? err.message : "Internal server error",
  });
});

const PORT = process.env.PORT || 5001;

// connectDB() was previously fired and forgotten, so the server began accepting
// traffic — and the GPS simulator began writing — before Mongo was reachable.
// Awaiting it means we are genuinely ready when we say we are.
const start = async () => {
  await connectDB();
  startGpsSimulator(io);
  server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
};

start();

// A rejected promise with no handler terminates the process on Node 16+ with a
// bare stack trace and no cleanup. Log it loudly, then shut down deliberately.
process.on("unhandledRejection", (reason) => {
  console.error("❌ Unhandled promise rejection:", reason);
  server.close(() => process.exit(1));
});

// Platforms send SIGTERM before killing a container. Draining connections and
// closing the Mongo pool avoids half-written documents on every redeploy.
const shutdown = (signal) => {
  console.log(`\n${signal} received — shutting down gracefully...`);
  server.close(async () => {
    await mongoose.connection.close();
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10000).unref();
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
