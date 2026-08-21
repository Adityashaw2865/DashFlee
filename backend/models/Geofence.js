import mongoose from "mongoose";

const geofenceSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    center: {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true },
    },
    radius: { type: Number, required: true, default: 2000 }, // meters
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model("Geofence", geofenceSchema);
