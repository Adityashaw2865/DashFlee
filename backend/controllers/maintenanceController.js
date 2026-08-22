import MaintenanceRecord from "../models/MaintenanceRecord.js";

export const getRecords = async (req, res) => {
  try {
    const records = await MaintenanceRecord.find()
      .populate("vehicle", "vehicleNumber")
      .sort({ date: -1 });
    res.json(records);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getCostSummary = async (req, res) => {
  try {
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
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
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
  try {
    const record = await MaintenanceRecord.findByIdAndDelete(req.params.id);
    if (!record) return res.status(404).json({ message: "Record not found" });
    res.json({ message: "Record removed" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
