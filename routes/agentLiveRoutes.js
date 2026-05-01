import express from "express";
import { getAgentLiveData } from "../controllers/agentLiveController.js";

const router = express.Router();

// 🔥 GET LIVE AGENT DATA
router.get("/:agentId", getAgentLiveData);

export default router;