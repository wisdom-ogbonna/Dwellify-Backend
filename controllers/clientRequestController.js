import redisClient from "../config/redis.js";
import { db } from "../config/firebase.js";

/**
 * ACCEPT REQUEST
 */
export const acceptClientRequest = async (req, res) => {
  try {
    const { agentId, requestId } = req.body;

    if (!agentId || !requestId) {
      return res.status(400).json({ error: "Missing fields" });
    }

    const requestKey = `client:request:${requestId}`;
    const request = await redisClient.hGetAll(requestKey);

    if (!request || !request.clientId) {
      return res.status(404).json({ error: "Request not found" });
    }

    if (request.agentId !== agentId) {
      return res.status(403).json({ error: "Request not assigned to you" });
    }

    if (request.status !== "offered") {
      return res.status(400).json({ error: "Request is not available" });
    }

    await redisClient.hSet(requestKey, {
      status: "matched",
      matchedAt: Date.now().toString(),
    });

    // ✅ SET AGENT STATUS (SEPARATE LINE)
    await redisClient.set(`agent:status:${agentId}`, "matched");

    await redisClient.hIncrBy(`agent:location:${agentId}`, "load", 1);

    await db.collection("matches").add({
      requestId,
      clientId: request.clientId,
      agentId,
      propertyType: request.propertyType,
      lat: Number(request.lat),
      lng: Number(request.lng),
      status: "matched",
      createdAt: new Date(),
    });

    return res.json({
      message: "Request accepted successfully",
      requestId,
      agentId,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

/**
 * DECLINE REQUEST
 */
export const declineClientRequest = async (req, res) => {
  try {
    const { agentId, requestId } = req.body;

    if (!agentId || !requestId) {
      return res.status(400).json({ error: "Missing fields" });
    }

    const requestKey = `client:request:${requestId}`;
    const request = await redisClient.hGetAll(requestKey);

    if (!request || !request.clientId) {
      return res.status(404).json({ error: "Request not found" });
    }

    if (request.agentId !== agentId) {
      return res.status(403).json({ error: "Request not assigned to you" });
    }

    if (request.status !== "offered") {
      return res
        .status(400)
        .json({ error: "Request is not available for decline" });
    }

    await redisClient.hSet(requestKey, {
      status: "declined",
      declinedAt: Date.now().toString(),
    });

    await redisClient.sAdd(`client:request:declined:${requestId}`, agentId);

    return res.json({
      message: "Request declined successfully",
      requestId,
      agentId,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

export const startInspection = async (req, res) => {
  try {
    const { agentId, requestId } = req.body;

    const requestKey = `client:request:${requestId}`;
    const request = await redisClient.hGetAll(requestKey);

    if (!request || !request.clientId) {
      return res.status(404).json({ error: "Request not found" });
    }

    if (request.agentId !== agentId) {
      return res.status(403).json({ error: "Not your request" });
    }

    if (request.status !== "matched") {
      return res.status(400).json({
        error: "Inspection can only start after match",
      });
    }

    await redisClient.hSet(requestKey, {
      status: "inspection_started",
      inspectionStartedAt: Date.now().toString(),
    });

    await redisClient.set(`agent:status:${agentId}`, "inspection_started");

    return res.json({
      message: "Inspection started",
      requestId,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
};

export const endInspection = async (req, res) => {
  try {
    const { agentId, requestId } = req.body;

    const requestKey = `client:request:${requestId}`;
    const request = await redisClient.hGetAll(requestKey);

    if (!request || !request.clientId) {
      return res.status(404).json({ error: "Request not found" });
    }

    if (request.agentId !== agentId) {
      return res.status(403).json({ error: "Not your request" });
    }

    if (request.status !== "inspection_started") {
      return res.status(400).json({
        error: "Inspection has not started",
      });
    }

    await redisClient.hSet(requestKey, {
      status: "inspection_completed",
      inspectionEndedAt: Date.now().toString(),
    });

    await redisClient.set(`agent:status:${agentId}`, "inspection_completed");

    await redisClient.hIncrBy(`agent:location:${agentId}`, "load", -1);

    return res.json({
      message: "Inspection completed",
      requestId,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
};
