// routes/locationRoutes.js
import express from "express";
import {
  updateLocation,
  getAgentLocation,
  getAllAgents,
  matchAgentToClient, // NEW
} from "../controllers/locationController.js";

const router = express.Router();

// Agent updates location
router.post("/update", updateLocation);

// Get agent location
router.get("/:agentId", getAgentLocation);

// Get all online agents
router.get("/", getAllAgents);

// Match agent to client ✅
router.post("/match", matchAgentToClient);

export default router;
