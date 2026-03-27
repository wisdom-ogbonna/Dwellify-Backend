import express from "express";
import { getProductsByAgentId } from "../controllers/getProductsByAgentId.js";
import { verifyFirebaseToken } from "../middlewares/auth.js";


const router = express.Router();

/**
 * PUBLIC — CLIENT VIEW
 */
router.get("/:agentId", verifyFirebaseToken,getProductsByAgentId);

export default router;
