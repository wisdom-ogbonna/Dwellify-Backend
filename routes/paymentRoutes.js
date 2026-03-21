import express from "express";
import {
  initializePayment,
  paystackWebhook,
} from "../controllers/paymentController.js";

const router = express.Router();

// ✅ NEW route (payment link)
router.post("/pay", initializePayment);

// ✅ keep webhook
router.post("/webhook", express.json(), paystackWebhook);

export default router;