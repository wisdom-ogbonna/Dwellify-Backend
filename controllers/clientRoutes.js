import { Router } from "express";
import { verifyFirebaseToken } from "../middlewares/auth.js";
import {
  verifyClient,
  getClientProfile,
} from "../controllers/clientController.js";

const router = Router();

// POST /api/client/verify
router.post("/verify", verifyFirebaseToken, verifyClient);

// GET /api/client/profile/:uid
router.get("/profile/:uid", verifyFirebaseToken, getClientProfile);

export default router;