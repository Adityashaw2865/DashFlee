import express from "express";
import {
  getVehicles,
  getVehicleStats,
  createVehicle,
  updateVehicle,
  deleteVehicle,
  reportDamage,
  getVehicleHistory,
} from "../controllers/vehicleController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

router.get("/", protect, getVehicles);
router.get("/stats", protect, getVehicleStats);
router.get("/:id/history", protect, getVehicleHistory);
router.post("/", protect, createVehicle);
router.put("/:id", protect, updateVehicle);
router.delete("/:id", protect, deleteVehicle);
router.post("/:id/report-damage", protect, reportDamage);

export default router;
