import redisClient from "../config/redis.js";
import { db } from "../config/firebase.js";

/**
 * ===============================
 * AGENT GO ONLINE (MANUAL)
 * ===============================
 */
export const agentGoOnline = async (req, res) => {
  try {
    const { agentId } = req.body;

    if (!agentId) {
      return res.status(400).json({ error: "Missing agentId" });
    }

    const key = `agent:location:${agentId}`;

    await redisClient.hSet(key, {
      isOnline: "true",
      updatedAt: Date.now().toString(),
    });

    return res.json({
      message: "Agent is ONLINE",
      agentId,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
};


export const agentGoOffline = async (req, res) => {
  try {
    const { agentId } = req.body;

    if (!agentId) {
      return res.status(400).json({ error: "Missing agentId" });
    }

    // 🔥 Agent explicitly goes offline
    await redisClient.del(`agent:location:${agentId}`);

    return res.json({
      message: "Agent is OFFLINE",
      agentId,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
};

/**
 * ===============================
 * UPDATE LOCATION (CONTINUOUS)
 * ===============================
 */
export const updateLocation = async (req, res) => {
  try {
    const { agentId, lat, lng, load = 0, rating = 5 } = req.body;

    if (!agentId || lat == null || lng == null) {
      return res.status(400).json({ error: "Missing agentId, lat or lng" });
    }

    const key = `agent:location:${agentId}`;

    const isOnline = await redisClient.hGet(key, "isOnline");
    if (isOnline !== "true") {
      return res.status(403).json({
        error: "Agent is offline. Cannot update location.",
      });
    }

    await redisClient.hSet(key, {
      lat: String(lat),
      lng: String(lng),
      load: String(load),
      rating: String(rating),
      updatedAt: Date.now().toString(),
    });

    return res.json({
      message: "Location updated",
      agentId,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
};

/**
 * ===============================
 * GET SINGLE AGENT
 * ===============================
 */

export const getAgentLocation = async (req, res) => {
  try {
    const { agentId } = req.params;

    // 1️⃣ Get Redis location
    const key = `agent:location:${agentId}`;
    const redisData = await redisClient.hGetAll(key);

    if (!redisData || redisData.isOnline !== "true") {
      return res.status(404).json({ error: "Agent offline" });
    }

    // 2️⃣ Get Firestore agent profile
    const userSnap = await db.collection("users").doc(agentId).get();

    if (!userSnap.exists) {
      return res.status(404).json({ error: "Agent not found" });
    }

    const userData = userSnap.data();

    if (userData.role !== "agent" || !userData.agentDetails) {
      return res.status(400).json({ error: "User is not an agent" });
    }

    const agent = userData.agentDetails;

    // 3️⃣ Merge Redis + Firestore
    return res.json({
      agentId,

      // 🔹 Firestore data
      name: agent.name,
      phone: agent.phone,
      email: agent.email,
      agencyName: agent.agencyName,
      licenseId: agent.licenseId,
      verified: agent.verified,

      // 🔹 Redis data
      lat: redisData.lat ? Number(redisData.lat) : null,
      lng: redisData.lng ? Number(redisData.lng) : null,
      load: Number(redisData.load || 0),
      rating: Number(redisData.rating || 5),
      updatedAt: Number(redisData.updatedAt),
      isOnline: true,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
};


/**
 * ===============================
 * GET ALL ONLINE AGENTS
 * ===============================
 */

export const getAllAgents = async (req, res) => {
  try {
    const keys = await redisClient.keys("agent:location:*");
    const agents = [];

    for (const key of keys) {
      const agentId = key.split(":")[2];
      const redisData = await redisClient.hGetAll(key);

      // Skip offline agents
      if (redisData.isOnline !== "true") continue;

      // 🔥 Get agent profile from Firestore
      const userSnap = await db.collection("users").doc(agentId).get();
      if (!userSnap.exists) continue;

      const userData = userSnap.data();

      // Ensure user is an agent
      if (userData.role !== "agent" || !userData.agentDetails) continue;

      const agentDetails = userData.agentDetails;

      agents.push({
        agentId,

        // 🔹 From Firestore
        name: agentDetails.name,
        phone: agentDetails.phone,
        email: agentDetails.email,
        agencyName: agentDetails.agencyName,
        licenseId: agentDetails.licenseId,
        verified: agentDetails.verified,

        // 🔹 From Redis
        lat: redisData.lat ? Number(redisData.lat) : null,
        lng: redisData.lng ? Number(redisData.lng) : null,
        load: Number(redisData.load || 0),
        rating: Number(redisData.rating || 5),
        updatedAt: Number(redisData.updatedAt),
      });
    }

    return res.json(agents);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
};
