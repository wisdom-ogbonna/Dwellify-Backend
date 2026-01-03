import express from "express";
import { getProductsByAgentId } from "../controllers/getProductsByAgentId.js";


const router = express.Router();

/**
 * PUBLIC — CLIENT VIEW
 */
router.get("/:agentId", getProductsByAgentId);

export default router;
