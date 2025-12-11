import redisClient from "../config/redis.js";

/**
 * Update agent location
 */
export const updateLocation = async (req, res) => {
  try {
    const { agentId, lat, lng, load = 0, rating = 5 } = req.body;

    if (!agentId || lat == null || lng == null) {
      return res.status(400).json({ error: "Missing agentId, lat or lng" });
    }

    const key = `agent:location:${agentId}`;
    const updatedAt = Date.now().toString();

    await redisClient.hSet(key, {
      lat: String(lat),
      lng: String(lng),
      load: String(load),
      rating: String(rating),
      updatedAt,
    });

    await redisClient.expire(key, 60);

    const io = req.app?.get("io");
    if (io) {
      io.emit("agentLocationUpdated", { agentId, lat, lng, updatedAt });
    }

    return res.json({ message: "Location updated" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
};

/**
 * Get a single agent location
 */
export const getAgentLocation = async (req, res) => {
  try {
    const key = `agent:location:${req.params.agentId}`;
    const data = await redisClient.hGetAll(key);

    if (!data || !data.lat) {
      return res.status(404).json({ error: "Agent offline" });
    }

    return res.json({
      agentId: req.params.agentId,
      lat: parseFloat(data.lat),
      lng: parseFloat(data.lng),
      load: Number(data.load || 0),
      rating: Number(data.rating || 5),
      updatedAt: Number(data.updatedAt),
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
};

/**
 * Get all active agents
 */
export const getAllAgents = async (req, res) => {
  try {
    const keys = await redisClient.keys("agent:location:*");
    const agents = [];

    for (const key of keys) {
      const id = key.split(":")[2];
      const data = await redisClient.hGetAll(key);

      if (data && data.lat) {
        agents.push({
          agentId: id,
          lat: parseFloat(data.lat),
          lng: parseFloat(data.lng),
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

/**
 * Distance calculator (Haversine)
 */
function getDistance(lat1, lng1, lat2, lng2) {
  const R = 6371; // KM
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * ✅ Match agent to client using your scoring system
 * POST /api/location/match
 * Body: { clientId, lat, lng }
 */
export const matchAgentToClient = async (req, res) => {
  try {
    const { clientId, lat, lng } = req.body;

    if (!clientId || lat == null || lng == null) {
      return res.status(400).json({ error: "Missing clientId, lat or lng" });
    }

    const keys = await redisClient.keys("agent:location:*");
    if (!keys.length) return res.status(404).json({ error: "No agents online" });

    let bestAgent = null;
    let bestScore = Infinity;

    for (const key of keys) {
      const id = key.split(":")[2];
      const agent = await redisClient.hGetAll(key);

      if (!agent.lat) continue;

      const distance = getDistance(
        lat,
        lng,
        parseFloat(agent.lat),
        parseFloat(agent.lng)
      );

      const ETA = (distance / 40) * 60; // minutes @ avg 40 km/h
      const load = Number(agent.load || 0);
      const rating = Number(agent.rating || 5);

      // Your formula ✅
      const score = 0.7 * ETA + 0.2 * load + 0.1 * (5 - rating);

      if (score < bestScore) {
        bestScore = score;
        bestAgent = {
          agentId: id,
          lat: parseFloat(agent.lat),
          lng: parseFloat(agent.lng),
          ETA: Number(ETA.toFixed(2)),
          load,
          rating,
          score: Number(score.toFixed(2)),
        };
      }
    }

    if (!bestAgent) {
      return res.status(404).json({ error: "No suitable agent found" });
    }

    return res.json({
      message: "Best agent matched",
      clientId,
      agent: bestAgent,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
};
