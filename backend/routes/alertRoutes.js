import express from "express";
import { getAlerts, resolveAlert, dispatchTeam } from "../controllers/alertController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

router.get("/", protect, getAlerts);
router.put("/:id/resolve", protect, resolveAlert);
router.put("/:id/dispatch", protect, dispatchTeam);

export default router;
