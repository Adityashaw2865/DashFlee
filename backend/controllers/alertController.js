import Alert from "../models/Alert.js";
import Vehicle from "../models/Vehicle.js";

export const getAlerts = async (req, res) => {
  const alerts = await Alert.find().populate("vehicle", "vehicleNumber location").sort({ createdAt: -1 });
  res.json(alerts);
};

export const resolveAlert = async (req, res) => {
  const { replacementVehicleId } = req.body;
  const alert = await Alert.findById(req.params.id);
  alert.status = "Resolved";
  if (replacementVehicleId) alert.replacementAssigned = replacementVehicleId;
  await alert.save();

  const io = req.app.get("io");
  io.emit("alertResolved", alert);

  res.json(alert);
};

export const dispatchTeam = async (req, res) => {
  const alert = await Alert.findById(req.params.id);
  alert.status = "In Progress";
  await alert.save();

  const io = req.app.get("io");
  io.emit("alertUpdated", alert);

  res.json(alert);
};
