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

    await redisClient.hIncrBy(`agent:location:${agentId}`, "load", 1);

    await db.collection("matches").add({
      requestId,
      clientId: request.clientId,
      agentId,
      propertyType: request.propertyType,
      lat: Number(request.lat),
      lng: Number(request.lng),
      status: "active",
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

    await redisClient.sAdd(
      `client:request:declined:${requestId}`,
      agentId
    );

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
