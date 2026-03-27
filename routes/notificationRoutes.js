import express from "express";
import { agentNotification } from "../controllers/agentNotification.js";
import { clinetRequest } from "../controllers/clinetRequest.js";
import { verifyFirebaseToken } from "../middlewares/auth.js";

const router = express.Router();

router.post("/notifications/agent", verifyFirebaseToken,agentNotification);



router.post("/notifications/request", verifyFirebaseToken,clinetRequest);

export default router;
