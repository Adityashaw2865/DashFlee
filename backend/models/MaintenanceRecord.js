import mongoose from "mongoose";

const maintenanceRecordSchema = new mongoose.Schema(
  {
    vehicle: { type: mongoose.Schema.Types.ObjectId, ref: "Vehicle", required: true },
    type: {
      type: String,
      enum: ["Fuel", "Charging", "Repair", "Service", "Tyres", "Insurance", "Other"],
      default: "Service",
    },
    description: { type: String, default: "" },
    cost: { type: Number, required: true },
    odometer: { type: Number, default: 0 },
    date: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default mongoose.model("MaintenanceRecord", maintenanceRecordSchema);
