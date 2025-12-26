import redisClient from "../config/redis.js";

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

/**
 * ===============================
 * AGENT GO OFFLINE (MANUAL)
 * ===============================
 */
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
    const key = `agent:location:${req.params.agentId}`;
    const data = await redisClient.hGetAll(key);

    if (!data || data.isOnline !== "true") {
      return res.status(404).json({ error: "Agent offline" });
    }

    return res.json({
      agentId: req.params.agentId,
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