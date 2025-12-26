import redisClient from "../config/redis.js";
import { distanceInKm } from "../utils/distance.js";

/**
 * CLIENT CREATES A REQUEST
 */
export const createClientRequest = async (req, res) => {
  try {
    const { clientId, lat, lng } = req.body;

    if (!clientId || lat == null || lng == null) {
      return res.status(400).json({ error: "Missing fields" });
    }

    const requestId = `req_${Date.now()}`;

    await redisClient.hSet(`client:request:${requestId}`, {
      clientId,
      lat: String(lat),
      lng: String(lng),
      status: "pending",
      createdAt: Date.now().toString(),
    });

    res.json({ requestId, message: "Client request created" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

/**
 * MATCH CLIENT TO BEST AGENT
 */
export const matchAgentToClient = async (req, res) => {
  try {
    const { requestId } = req.params;

    const request = await redisClient.hGetAll(`client:request:${requestId}`);
    if (!request || request.status !== "pending") {
      return res.status(404).json({ error: "Invalid request" });
    }

    const clientLat = Number(request.lat);
    const clientLng = Number(request.lng);

    const agentKeys = await redisClient.keys("agent:location:*");

    let bestAgent = null;
    let bestScore = Infinity;

    for (const key of agentKeys) {
      const agent = await redisClient.hGetAll(key);

      // ✅ agent considered online if location exists
      if (!agent.lat || !agent.lng) continue;

      const distance = distanceInKm(
        clientLat,
        clientLng,
        Number(agent.lat),
        Number(agent.lng)
      );

      if (distance > 5000) continue; // 5km radius

      const load = Number(agent.load || 0);
      const rating = Number(agent.rating || 5);

      const score = distance * 1.5 + load * 2 - rating;

      if (score < bestScore) {
        bestScore = score;
        bestAgent = {
          agentId: key.split(":")[2],
          distance,
          load,
          rating,
        };
      }
    }

    if (!bestAgent) {
      return res.status(404).json({ error: "No agent available" });
    }

    await redisClient.hSet(`match:${requestId}`, {
      agentId: bestAgent.agentId,
      clientId: request.clientId,
      assignedAt: Date.now().toString(),
    });

    await redisClient.hSet(`client:request:${requestId}`, {
      status: "assigned",
    });

    await redisClient.hIncrBy(
      `agent:location:${bestAgent.agentId}`,
      "load",
      1
    );

    res.json({ message: "Agent matched", agent: bestAgent });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};
