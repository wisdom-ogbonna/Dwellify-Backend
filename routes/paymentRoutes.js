import express from "express";
import { payAndReactivateAgent } from "../controllers/paymentController.js";

const router = express.Router();

router.post("/pay", payAndReactivateAgent);

export default router;