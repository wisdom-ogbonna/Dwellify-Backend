import { Router } from "express";
import { assignRole } from "../controllers/roleController.js";

const router = Router();

// POST /api/role/assign
router.post("/assign", assignRole);

export default router;
