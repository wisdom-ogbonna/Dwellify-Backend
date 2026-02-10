import express from "express";
import { agentNotification } from "../controllers/agentNotification.js";
import { clinetRequest } from "../controllers/clinetRequest.js";

const router = express.Router();

router.post("/notifications/agent", agentNotification);



router.post("/notifications/request", clinetRequest);

export default router;
