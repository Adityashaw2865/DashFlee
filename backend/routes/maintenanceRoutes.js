import express from "express";
import {
  getRecords,
  getCostSummary,
  createRecord,
  deleteRecord,
} from "../controllers/maintenanceController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

router.get("/", protect, getRecords);
router.get("/summary", protect, getCostSummary);
router.post("/", protect, createRecord);
router.delete("/:id", protect, deleteRecord);

export default router;
