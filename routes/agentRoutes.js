import { Router } from "express";
import { getAgentProfile, verifyAgent } from "../controllers/agentController.js";
import { verifyFirebaseToken } from "../middlewares/auth.js";

const router = Router();

// GET /api/agent/profile/:uid
router.get("/profile/:uid", verifyFirebaseToken, getAgentProfile);
router.post("/verify", verifyFirebaseToken, verifyAgent);

export default router;
