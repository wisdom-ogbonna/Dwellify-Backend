import express from "express";
import {
  createClientRequest,
  matchAgentToClient,
} from "../controllers/matchController.js";
import { verifyFirebaseToken } from "../middlewares/auth.js";

const router = express.Router();

router.post("/request", verifyFirebaseToken,createClientRequest);
router.post("/match/:requestId", verifyFirebaseToken,matchAgentToClient);



export default router;
