import express from "express";
import {
  acceptClientRequest,
  declineClientRequest,
  endInspection,
  startInspection,
} from "../controllers/clientRequestController.js";

const router = express.Router();

/**
 * Agent accepts a client request
 */
router.post("/request/accept", acceptClientRequest);
router.post("/request/decline", declineClientRequest);
router.post("/inspection/start", startInspection);
router.post("/inspection/end", endInspection);

export default router;
