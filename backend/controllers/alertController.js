import Alert from "../models/Alert.js";
import Vehicle from "../models/Vehicle.js";

export const getAlerts = async (req, res) => {
  try {
    const alerts = await Alert.find().populate("vehicle", "vehicleNumber location").sort({ createdAt: -1 });
    res.json(alerts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const resolveAlert = async (req, res) => {
  try {
    const { replacementVehicleId } = req.body;
    const alert = await Alert.findById(req.params.id);
    if (!alert) return res.status(404).json({ message: "Alert not found" });

    alert.status = "Resolved";
    if (replacementVehicleId) alert.replacementAssigned = replacementVehicleId;
    await alert.save();

    const io = req.app.get("io");
    io.emit("alertResolved", alert);

    res.json(alert);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const dispatchTeam = async (req, res) => {
  try {
    const alert = await Alert.findById(req.params.id);
    if (!alert) return res.status(404).json({ message: "Alert not found" });

    alert.status = "In Progress";
    await alert.save();

    const io = req.app.get("io");
    io.emit("alertUpdated", alert);

    res.json(alert);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
