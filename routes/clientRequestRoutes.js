import express from "express";
import {
  acceptClientRequest,
  declineClientRequest,
  endInspection,
  startInspection,
} from "../controllers/clientRequestController.js";
import { verifyFirebaseToken } from "../middlewares/auth.js";

const router = express.Router();

/**
 * Agent accepts a client request
 */
router.post("/request/accept", verifyFirebaseToken,acceptClientRequest);
router.post("/request/decline", verifyFirebaseToken,declineClientRequest);
router.post("/inspection/start", verifyFirebaseToken,startInspection);
router.post("/inspection/end", verifyFirebaseToken,endInspection);

export default router;
