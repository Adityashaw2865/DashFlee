import mongoose from "mongoose";

const vehicleSchema = new mongoose.Schema(
  {
    vehicleNumber: { type: String, required: true, unique: true },
    rfidTag: { type: String, required: true, unique: true },
    model: { type: String, default: "Electric Bus - Tata Starbus" },
    status: {
      type: String,
      enum: ["Active", "Idle", "Under Service"],
      default: "Idle",
    },
    driver: { type: mongoose.Schema.Types.ObjectId, ref: "Driver" },
    location: {
      lat: { type: Number, default: 22.5726 },
      lng: { type: Number, default: 88.3639 },
    },
    speed: { type: Number, default: 0 },
    soc: { type: Number, default: 100 }, // State of Charge %
    lastServiceDate: { type: Date, default: Date.now },
    documentsValid: { type: Boolean, default: true },
    // geofence zone IDs this vehicle is currently inside — persisted (not in-memory)
    // so entry/exit detection survives server restarts and works across multiple
    // backend instances (horizontal scaling), instead of relying on a process-local Map.
    currentZones: [{ type: mongoose.Schema.Types.ObjectId, ref: "Geofence" }],
    locationHistory: [
      {
        lat: Number,
        lng: Number,
        speed: Number,
        soc: Number,
        timestamp: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.model("Vehicle", vehicleSchema);
