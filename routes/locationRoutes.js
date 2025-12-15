import express from "express";
import {
  agentGoOnline,
  agentGoOffline,
  updateLocation,
  getAgentLocation,
  getAllAgents,
} from "../controllers/locationController.js";

const router = express.Router();

router.post("/online", agentGoOnline);
router.post("/offline", agentGoOffline);
router.post("/update", updateLocation);
router.get("/:agentId", getAgentLocation);
router.get("/", getAllAgents);

export default router;
