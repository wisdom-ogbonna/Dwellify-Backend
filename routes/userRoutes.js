import express from "express";
import { getAllAgents, getAllClients } from "../controllers/userController.js";

const router = express.Router();

router.get("/agents", getAllAgents);
router.get("/clients", getAllClients);

export default router;