import Geofence from "../models/Geofence.js";

export const getGeofences = async (req, res) => {
  const zones = await Geofence.find();
  res.json(zones);
};

export const createGeofence = async (req, res) => {
  try {
    const zone = await Geofence.create(req.body);
    res.status(201).json(zone);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

export const updateGeofence = async (req, res) => {
  const zone = await Geofence.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(zone);
};

export const deleteGeofence = async (req, res) => {
  await Geofence.findByIdAndDelete(req.params.id);
  res.json({ message: "Geofence removed" });
};
