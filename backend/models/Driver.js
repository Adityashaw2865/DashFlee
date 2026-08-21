import mongoose from "mongoose";

const driverSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    rfidId: { type: String, required: true, unique: true },
    licenseNumber: { type: String, required: true },
    phone: { type: String, required: true },
    experience: { type: Number, default: 1 }, // years
    assignedVehicle: { type: mongoose.Schema.Types.ObjectId, ref: "Vehicle" },
    status: { type: String, enum: ["On Duty", "Off Duty"], default: "Off Duty" },
    rating: { type: Number, default: 4.5 },
    tripsCompleted: { type: Number, default: 0 },
    onTimePercent: { type: Number, default: 95 },
    safetyScore: { type: Number, default: 90 },
    harshBrakingEvents: { type: Number, default: 0 },
    avgSpeed: { type: Number, default: 32 },
  },
  { timestamps: true }
);

export default mongoose.model("Driver", driverSchema);
