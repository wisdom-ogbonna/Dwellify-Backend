import { Router } from "express";
import { getAgentProfile } from "../controllers/agentController.js";
import { verifyFirebaseToken } from "../middlewares/auth.js";

const router = Router();

// GET /api/agent/profile/:uid
router.get("/profile/:uid", verifyFirebaseToken, getAgentProfile);
router.post("/agent/verify", verifyAgent);

export default router;
