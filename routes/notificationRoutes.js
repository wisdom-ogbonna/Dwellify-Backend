import express from "express";
import { agentNotification } from "../controllers/agentNotification.js";
import { clinetRequest } from "../controllers/clinetRequest.js";

const router = express.Router();

/**
 * Save agent push notification token
 * POST /api/notifications/agent
 */
router.post("/notifications/agent", agentNotification);

/**
 * Create client request + send push notification
 * POST /api/notifications/request
 */
router.post("/notifications/request", clinetRequest);

export default router;
