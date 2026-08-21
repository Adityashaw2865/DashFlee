import express from "express";
import {
  getGeofences,
  createGeofence,
  updateGeofence,
  deleteGeofence,
} from "../controllers/geofenceController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

router.get("/", protect, getGeofences);
router.post("/", protect, createGeofence);
router.put("/:id", protect, updateGeofence);
router.delete("/:id", protect, deleteGeofence);

export default router;
