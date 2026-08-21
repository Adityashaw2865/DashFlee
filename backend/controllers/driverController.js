import Driver from "../models/Driver.js";
import Vehicle from "../models/Vehicle.js";

export const getDrivers = async (req, res) => {
  const drivers = await Driver.find().populate("assignedVehicle", "vehicleNumber status");
  res.json(drivers);
};

export const createDriver = async (req, res) => {
  try {
    const driver = await Driver.create(req.body);
    res.status(201).json(driver);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

export const updateDriver = async (req, res) => {
  const driver = await Driver.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(driver);
};

export const deleteDriver = async (req, res) => {
  await Driver.findByIdAndDelete(req.params.id);
  res.json({ message: "Driver removed" });
};

export const getDriverPerformance = async (req, res) => {
  const drivers = await Driver.find().populate("assignedVehicle", "vehicleNumber");
  const performance = drivers.map((d) => ({
    _id: d._id,
    name: d.name,
    vehicle: d.assignedVehicle?.vehicleNumber || "Unassigned",
    rating: d.rating,
    tripsCompleted: d.tripsCompleted,
    onTimePercent: d.onTimePercent,
    safetyScore: d.safetyScore,
    harshBrakingEvents: d.harshBrakingEvents,
    avgSpeed: d.avgSpeed,
    experience: d.experience,
  }));
  res.json(performance);
};

export const assignVehicle = async (req, res) => {
  const { vehicleId } = req.body;
  const driver = await Driver.findById(req.params.id);
  driver.assignedVehicle = vehicleId;
  driver.status = "On Duty";
  await driver.save();

  await Vehicle.findByIdAndUpdate(vehicleId, { driver: driver._id, status: "Active" });

  res.json(driver);
};
