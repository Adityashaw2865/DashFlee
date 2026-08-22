import Geofence from "../models/Geofence.js";

export const getGeofences = async (req, res) => {
  try {
    const zones = await Geofence.find();
    res.json(zones);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
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
  try {
    const zone = await Geofence.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!zone) return res.status(404).json({ message: "Geofence not found" });
    res.json(zone);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

export const deleteGeofence = async (req, res) => {
  try {
    const zone = await Geofence.findByIdAndDelete(req.params.id);
    if (!zone) return res.status(404).json({ message: "Geofence not found" });
    res.json({ message: "Geofence removed" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
