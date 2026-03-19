import express from "express";
import cors from "cors";
import "dotenv/config";
import http from "http";
import { Server as IOServer } from "socket.io";

import "./config/redis.js";
import otpRoutes from "./routes/otpRoutes.js";
import roleRoutes from "./routes/roleRoutes.js";
import agentRoutes from "./routes/agentRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import locationRoutes from "./routes/locationRoutes.js";
import matchRoutes from "./routes/matchRoutes.js";
import getProductsByAgentId from "./routes/getProductsByAgentId.js";
import clientRequestRoutes from "./routes/clientRequestRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import clientRoutes from "./routes/clientRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";

const app = express();
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
  })
);
app.use(express.json());
app.use("/api/otp", otpRoutes);
app.use("/api/role", roleRoutes);
app.use("/api/client", clientRoutes);
app.use("/api/agent", agentRoutes);
app.use("/api/products", productRoutes);
app.use("/api/location", locationRoutes);
app.use("/api/match", matchRoutes);
app.use("/api/agentid", getProductsByAgentId);
app.use("/api", notificationRoutes);
app.use("/api/client", clientRequestRoutes);
app.use("/api/users", userRoutes);
app.use("/api/payment", paymentRoutes);





// ✅ Create HTTP server first
const server = http.createServer(app);

// ✅ Then attach socket.io
const io = new IOServer(server, {
  cors: { origin: "*" }
});

// Socket events
io.on("connection", (socket) => {
  console.log("Socket connected:", socket.id);
  socket.on("disconnect", () => console.log("Socket disconnected"));
});

// Make io accessible inside routes
app.set("io", io);

const PORT = process.env.PORT || 5000;

// ✅ Use server.listen NOT app.listen
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
