import express from "express";
import {
  acceptClientRequest,
  declineClientRequest,
} from "../controllers/clientRequestController.js";

const router = express.Router();

/**
 * Agent accepts a client request
 */
router.post("/request/accept", acceptClientRequest);

/**
 * Agent declines a client request
 */
router.post("/request/decline", declineClientRequest);

export default router;
