import express from "express";
import {
  getDrivers,
  createDriver,
  updateDriver,
  deleteDriver,
  assignVehicle,
  getDriverPerformance,
} from "../controllers/driverController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

router.get("/", protect, getDrivers);
router.get("/performance", protect, getDriverPerformance);
router.post("/", protect, createDriver);
router.put("/:id", protect, updateDriver);
router.delete("/:id", protect, deleteDriver);
router.post("/:id/assign", protect, assignVehicle);

export default router;
