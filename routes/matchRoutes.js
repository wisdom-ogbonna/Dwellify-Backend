import express from "express";
import {
  createClientRequest,
  matchAgentToClient,
} from "../controllers/matchController.js";

const router = express.Router();

router.post("/request", createClientRequest);
router.post("/match/:requestId", matchAgentToClient);

export default router;
