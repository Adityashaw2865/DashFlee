import Driver from "../models/Driver.js";
import Vehicle from "../models/Vehicle.js";

export const getDrivers = async (req, res) => {
  try {
    const drivers = await Driver.find().populate("assignedVehicle", "vehicleNumber status");
    res.json(drivers);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
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
  try {
    const driver = await Driver.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!driver) return res.status(404).json({ message: "Driver not found" });
    res.json(driver);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

export const deleteDriver = async (req, res) => {
  try {
    const driver = await Driver.findByIdAndDelete(req.params.id);
    if (!driver) return res.status(404).json({ message: "Driver not found" });
    res.json({ message: "Driver removed" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getDriverPerformance = async (req, res) => {
  try {
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
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const assignVehicle = async (req, res) => {
  try {
    const { vehicleId } = req.body;

    const driver = await Driver.findById(req.params.id);
    if (!driver) return res.status(404).json({ message: "Driver not found" });

    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) return res.status(404).json({ message: "Vehicle not found" });

    driver.assignedVehicle = vehicleId;
    driver.status = "On Duty";
    await driver.save();

    vehicle.driver = driver._id;
    vehicle.status = "Active";
    await vehicle.save();

    res.json(driver);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
