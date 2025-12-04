import { Router } from "express";
import { assignRole } from "../controllers/roleController.js";
import { verifyFirebaseToken } from "../middlewares/auth.js";

const router = Router();

// POST /api/role/assign
router.post("/assign", verifyFirebaseToken, assignRole);

export default router;
