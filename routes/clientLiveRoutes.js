import express from "express";
import { getClientLiveData } from "../controllers/clientLiveController.js";

const router = express.Router();

router.get("/:clientId", getClientLiveData);

export default router;