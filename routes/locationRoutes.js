import express from "express";
import {
  agentGoOnline,
  agentGoOffline,
  updateLocation,
  getAgentLocation,
  getAllAgents,
} from "../controllers/locationController.js";
import { verifyFirebaseToken } from "../middlewares/auth.js";

const router = express.Router();

router.post("/online", verifyFirebaseToken,agentGoOnline);
router.post("/offline", verifyFirebaseToken,agentGoOffline);
router.post("/update", verifyFirebaseToken,updateLocation);
router.get("/:agentId", verifyFirebaseToken,getAgentLocation);
router.get("/", verifyFirebaseToken,getAllAgents);

export default router;
