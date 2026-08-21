import Vehicle from "../models/Vehicle.js";
import Alert from "../models/Alert.js";

export const getVehicles = async (req, res) => {
  const vehicles = await Vehicle.find().populate("driver", "name rfidId phone");
  res.json(vehicles);
};

export const getVehicleStats = async (req, res) => {
  const total = await Vehicle.countDocuments();
  const active = await Vehicle.countDocuments({ status: "Active" });
  const idle = await Vehicle.countDocuments({ status: "Idle" });
  const underService = await Vehicle.countDocuments({ status: "Under Service" });
  const avgSoc = await Vehicle.aggregate([
    { $group: { _id: null, avg: { $avg: "$soc" } } },
  ]);
  res.json({
    total,
    active,
    idle,
    underService,
    avgSoc: avgSoc[0]?.avg?.toFixed(1) || 0,
  });
};

export const getVehicleHistory = async (req, res) => {
  const vehicle = await Vehicle.findById(req.params.id).select("vehicleNumber locationHistory");
  if (!vehicle) return res.status(404).json({ message: "Vehicle not found" });
  res.json({ vehicleNumber: vehicle.vehicleNumber, history: vehicle.locationHistory });
};

export const createVehicle = async (req, res) => {
  try {
    const vehicle = await Vehicle.create(req.body);
    res.status(201).json(vehicle);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

export const updateVehicle = async (req, res) => {
  const vehicle = await Vehicle.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
  });
  res.json(vehicle);
};

export const deleteVehicle = async (req, res) => {
  await Vehicle.findByIdAndDelete(req.params.id);
  res.json({ message: "Vehicle removed" });
};

// Simulate damage detection -> triggers full workflow
export const reportDamage = async (req, res) => {
  const vehicle = await Vehicle.findById(req.params.id);
  if (!vehicle) return res.status(404).json({ message: "Vehicle not found" });

  vehicle.status = "Under Service";
  await vehicle.save();

  const alert = await Alert.create({
    vehicle: vehicle._id,
    type: "Damage Detected",
    message: `${vehicle.vehicleNumber} reported a fault and has been marked Under Service.`,
    location: vehicle.location,
    status: "Open",
  });

  const io = req.app.get("io");
  io.emit("newAlert", alert);
  io.emit("vehicleUpdate", vehicle);

  res.json({ vehicle, alert });
};
