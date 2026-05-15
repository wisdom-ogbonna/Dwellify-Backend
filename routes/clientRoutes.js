import { Router } from "express";
import { verifyFirebaseToken } from "../middlewares/auth.js";
import {
  verifyClient,
  getClientProfile,
  deleteClientAccount,
} from "../controllers/clientController.js";

const router = Router();

// POST /api/client/verify
router.post("/verify", verifyFirebaseToken, verifyClient);

// GET /api/client/profile/:uid
router.get("/profile", verifyFirebaseToken, getClientProfile);
// DELETE /api/client/delete
router.delete("/delete", verifyFirebaseToken, deleteClientAccount);

export default router;
