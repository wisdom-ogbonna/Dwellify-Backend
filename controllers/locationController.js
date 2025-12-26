import redisClient from "../config/redis.js";
import { db } from "../config/firebase.js";
/**
 * ===============================
 * AGENT GO ONLINE
 * ===============================
 */

export const agentGoOnline = async (req, res) => {
  try {
    const { agentId } = req.body;

    if (!agentId) {
      return res.status(400).json({ error: "Missing agentId" });
    }

    // 🔥 Fetch profile from Firestore
    const userSnap = await db.collection("users").doc(agentId).get();

    if (!userSnap.exists) {
      return res.status(404).json({ error: "Agent not found" });
    }

    const userData = userSnap.data();

    if (userData.role !== "agent" || !userData.agentDetails) {
      return res.status(400).json({ error: "Invalid agent profile" });
    }

    const { name, phone, agencyName } = userData.agentDetails;

    const key = `agent:location:${agentId}`;

    // ✅ Store profile immediately
    await redisClient.hSet(key, {
      isOnline: "true",
      name: name || "",
      phone: phone || "",
      agencyName: agencyName || "",
      updatedAt: Date.now().toString(),
    });

    await redisClient.expire(key, 60);

    return res.json({
      message: "Agent is ONLINE",
      agentId,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
};


/**
 * ===============================
 * AGENT GO OFFLINE
 * ===============================
 */
export const agentGoOffline = async (req, res) => {
  try {
    const { agentId } = req.body;

    if (!agentId) {
      return res.status(400).json({ error: "Missing agentId" });
    }

    await redisClient.hSet(`agent:location:${agentId}`, {
      isOnline: "false",
      updatedAt: Date.now().toString(),
    });

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
 * UPDATE LOCATION (HEARTBEAT)
 * ===============================
 */

export const updateLocation = async (req, res) => {
  try {
    const {
      agentId,
      lat,
      lng,
      load = 0,
      rating = 5,
    } = req.body;

    if (!agentId || lat == null || lng == null) {
      return res.status(400).json({ error: "Missing agentId, lat or lng" });
    }

    const key = `agent:location:${agentId}`;

    const isOnline = await redisClient.hGet(key, "isOnline");
    if (isOnline !== "true") {
      return res.status(403).json({ error: "Agent is offline" });
    }

    // 🔥 FETCH AGENT PROFILE FROM FIRESTORE
    const userSnap = await db.collection("users").doc(agentId).get();

    if (!userSnap.exists) {
      return res.status(404).json({ error: "Agent profile not found" });
    }

    const userData = userSnap.data();

    if (userData.role !== "agent" || !userData.agentDetails) {
      return res.status(400).json({ error: "Invalid agent profile" });
    }

    const { name, phone, agencyName } = userData.agentDetails;

    // ✅ STORE EVERYTHING IN REDIS
    await redisClient.hSet(key, {
      lat: String(lat),
      lng: String(lng),
      load: String(load),
      rating: String(rating),
      name: name || "",
      phone: phone || "",
      agencyName: agencyName || "",
      updatedAt: Date.now().toString(),
    });

    await redisClient.expire(key, 60);

    return res.json({ message: "Location updated" });
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
    const key = `agent:location:${req.params.agentId}`;
    const data = await redisClient.hGetAll(key);

    if (!data || data.isOnline !== "true") {
      return res.status(404).json({ error: "Agent offline" });
    }

    return res.json({
      agentId: req.params.agentId,
      name: data.name || null,
      phone: data.phone || null,
      agencyName: data.agencyName || null,
      lat: Number(data.lat),
      lng: Number(data.lng),
      load: Number(data.load || 0),
      rating: Number(data.rating || 5),
      updatedAt: Number(data.updatedAt),
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
      const data = await redisClient.hGetAll(key);

      if (data.isOnline === "true") {
        agents.push({
          agentId: key.split(":")[2],
          name: data.name || null,
          phone: data.phone || null,
          agencyName: data.agencyName || null,
          lat: Number(data.lat),
          lng: Number(data.lng),
          load: Number(data.load || 0),
          rating: Number(data.rating || 5),
          updatedAt: Number(data.updatedAt),
        });
      }
    }

    return res.json(agents);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
};
