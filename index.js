import express from "express";
import "dotenv/config";
import http from "http";
import { Server as IOServer } from "socket.io";

import "./config/redis.js";
import otpRoutes from "./routes/otpRoutes.js";
import roleRoutes from "./routes/roleRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import locationRoutes from "./routes/locationRoutes.js";
import matchRoutes from "./routes/matchRoutes.js";
import agentRoutes from "./routes/agentRoutes.js";

const app = express();
app.use(express.json());
app.use("/api", agentRoutes);
app.use("/api/otp", otpRoutes);
app.use("/api/role", roleRoutes);
app.use("/api/products", productRoutes);
app.use("/api/location", locationRoutes);
app.use("/api/match", matchRoutes);
app.use("/api/agent", agentRoutes);



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
