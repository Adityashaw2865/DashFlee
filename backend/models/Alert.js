import mongoose from "mongoose";

const alertSchema = new mongoose.Schema(
  {
    vehicle: { type: mongoose.Schema.Types.ObjectId, ref: "Vehicle", required: true },
    type: {
      type: String,
      enum: ["Damage Detected", "Low SoC", "Document Expiry", "Maintenance Due", "Geofence Breach"],
      default: "Damage Detected",
    },
    message: { type: String, required: true },
    status: { type: String, enum: ["Open", "In Progress", "Resolved"], default: "Open" },
    location: {
      lat: Number,
      lng: Number,
    },
    replacementAssigned: { type: mongoose.Schema.Types.ObjectId, ref: "Vehicle" },
  },
  { timestamps: true }
);

export default mongoose.model("Alert", alertSchema);
