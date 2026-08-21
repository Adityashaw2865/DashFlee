import MaintenanceRecord from "../models/MaintenanceRecord.js";

export const getRecords = async (req, res) => {
  const records = await MaintenanceRecord.find()
    .populate("vehicle", "vehicleNumber")
    .sort({ date: -1 });
  res.json(records);
};

export const getCostSummary = async (req, res) => {
  const byType = await MaintenanceRecord.aggregate([
    { $group: { _id: "$type", total: { $sum: "$cost" } } },
  ]);
  const byVehicle = await MaintenanceRecord.aggregate([
    {
      $group: {
        _id: "$vehicle",
        total: { $sum: "$cost" },
        count: { $sum: 1 },
      },
    },
    {
      $lookup: {
        from: "vehicles",
        localField: "_id",
        foreignField: "_id",
        as: "vehicle",
      },
    },
    { $unwind: "$vehicle" },
    {
      $project: {
        vehicleNumber: "$vehicle.vehicleNumber",
        total: 1,
        count: 1,
      },
    },
  ]);
  const totalAgg = await MaintenanceRecord.aggregate([
    { $group: { _id: null, total: { $sum: "$cost" } } },
  ]);

  res.json({
    total: totalAgg[0]?.total || 0,
    byType,
    byVehicle,
  });
};

export const createRecord = async (req, res) => {
  try {
    const record = await MaintenanceRecord.create(req.body);
    const populated = await record.populate("vehicle", "vehicleNumber");
    res.status(201).json(populated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

export const deleteRecord = async (req, res) => {
  await MaintenanceRecord.findByIdAndDelete(req.params.id);
  res.json({ message: "Record removed" });
};
