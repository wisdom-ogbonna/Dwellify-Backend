import redisClient from "../config/redis.js";
import { db } from "../config/firebase.js";

/**
 * ===============================
 * CLIENT CREATES A REQUEST
 * ===============================
 * Body:
 * {
 *   clientId,
 *   lat,
 *   lng
 * }
 */
export const createClientRequest = async (req, res) => {
  try {
    const { clientId, lat, lng } = req.body;

    if (!clientId || lat == null || lng == null) {
      return res.status(400).json({ error: "Missing fields" });
    }

    const requestId = `req_${Date.now()}_${clientId}`;

    await redisClient.hSet(`client:request:${requestId}`, {
      clientId,
      lat: String(lat),
      lng: String(lng),
      status: "pending",
      createdAt: Date.now().toString(),
    });

    return res.json({
      message: "Client request created",
      requestId,
    });
  } catch (err) {
    console.error("Create request error:", err);
    return res.status(500).json({ error: "Server error" });
  }
};

/**
 * ===============================
 * MATCH AGENT TO CLIENT
 * ===============================
 * Params:
 * - requestId
 */
export const matchAgentToClient = async (req, res) => {
  try {
    const { requestId } = req.params;

    const requestKey = `client:request:${requestId}`;
    const requestData = await redisClient.hGetAll(requestKey);

    if (!requestData || !requestData.clientId) {
      return res.status(404).json({ error: "Request not found" });
    }

    if (requestData.status === "matched") {
      return res.status(400).json({ error: "Request already matched" });
    }

    const clientLat = Number(requestData.lat);
    const clientLng = Number(requestData.lng);

    const agentKeys = await redisClient.keys("agent:location:*");

    let selectedAgent = null;
    let shortestDistance = Infinity;

    for (const key of agentKeys) {
      const redisAgent = await redisClient.hGetAll(key);

      if (redisAgent.isOnline !== "true") continue;

      const agentLat = Number(redisAgent.lat);
      const agentLng = Number(redisAgent.lng);

      if (isNaN(agentLat) || isNaN(agentLng)) continue;

      const distance = getDistanceKm(
        clientLat,
        clientLng,
        agentLat,
        agentLng
      );

      if (distance < shortestDistance) {
        shortestDistance = distance;
        selectedAgent = {
          agentId: key.split(":")[2],
          redis: redisAgent,
          distance,
        };
      }
    }

    if (!selectedAgent) {
      return res.status(404).json({ error: "No available agents nearby" });
    }

    // 🔥 Get agent profile from Firestore
    const agentSnap = await db
      .collection("users")
      .doc(selectedAgent.agentId)
      .get();

    if (!agentSnap.exists) {
      return res.status(404).json({ error: "Agent profile not found" });
    }

    const agentUser = agentSnap.data();

    if (agentUser.role !== "agent" || !agentUser.agentDetails) {
      return res.status(400).json({ error: "User is not an agent" });
    }

    const agent = agentUser.agentDetails;

    // 🔒 Lock request
    await redisClient.hSet(requestKey, {
      status: "matched",
      agentId: selectedAgent.agentId,
      matchedAt: Date.now().toString(),
    });

    return res.json({
      message: "Agent matched successfully",

      request: {
        requestId,
        clientId: requestData.clientId,
      },

      agent: {
        agentId: selectedAgent.agentId,

        // 🔹 Firestore data
        name: agent.name,
        phone: agent.phone,
        email: agent.email,
        agencyName: agent.agencyName,
        licenseId: agent.licenseId,
        verified: agent.verified,

        // 🔹 Redis data
        lat: Number(selectedAgent.redis.lat),
        lng: Number(selectedAgent.redis.lng),
        load: Number(selectedAgent.redis.load || 0),
        rating: Number(selectedAgent.redis.rating || 5),

        distanceKm: Number(selectedAgent.distance.toFixed(2)),
      },
    });
  } catch (err) {
    console.error("Match error:", err);
    return res.status(500).json({ error: "Server error" });
  }
};

/**
 * ===============================
 * DISTANCE HELPER (HAVERSINE)
 * ===============================
 */
const getDistanceKm = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(deg2rad(lat1)) *
      Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) ** 2;
  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
};

const deg2rad = (deg) => deg * (Math.PI / 180);
