import redisClient from "../config/redis.js";
import { db } from "../config/firebase.js";
import { v4 as uuidv4 } from "uuid";

/**
 * ===============================
 * CREATE CLIENT REQUEST
 * ===============================
 */
export const createClientRequest = async (req, res) => {
  try {
    const { clientId, lat, lng, propertyType } = req.body;

    if (!clientId || lat == null || lng == null || !propertyType) {
      return res.status(400).json({ error: "Missing fields" });
    }

    if (!["Apartment", "Hotel", "Shortlet"].includes(propertyType)) {
      return res.status(400).json({ error: "Invalid property type" });
    }

    const requestId = uuidv4();
    const requestKey = `client:request:${requestId}`;

    await redisClient.hSet(requestKey, {
      clientId,
      lat: String(lat),
      lng: String(lng),
      propertyType,
      status: "pending",
      createdAt: Date.now().toString(),
    });

    // Optional TTL (e.g. 10 mins)
    await redisClient.expire(requestKey, 600);

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
 * MATCH AGENT TO CLIENT REQUEST
 * ===============================
 */
export const matchAgentToClient = async (req, res) => {
  try {
    const { requestId } = req.params;

    if (!requestId) {
      return res.status(400).json({ error: "Missing requestId" });
    }

    /**
     * 1️⃣ GET CLIENT REQUEST
     */
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
    const requestPropertyType = requestData.propertyType;

    if (isNaN(clientLat) || isNaN(clientLng)) {
      return res.status(400).json({ error: "Invalid client location" });
    }

    /**
     * 2️⃣ FIND ONLINE AGENTS
     */
    const agentKeys = await redisClient.keys("agent:location:*");

    let selectedAgent = null;
    let shortestDistance = Infinity;

    for (const key of agentKeys) {
      const redisAgent = await redisClient.hGetAll(key);

      if (!redisAgent || redisAgent.isOnline !== "true") continue;

      const agentId = key.split(":")[2];

      // Skip agents who declined this request
      const declinedAgents = await redisClient.sMembers(
        `client:request:declined:${requestId}`
      );
      if (declinedAgents.includes(agentId)) continue;

      const agentLat = Number(redisAgent.lat);
      const agentLng = Number(redisAgent.lng);
      if (isNaN(agentLat) || isNaN(agentLng)) continue;

      /**
       * 3️⃣ PROPERTY TYPE CHECK
       */
      let canServe = false;
      try {
        canServe = await agentHasPropertyType(
          agentId,
          requestPropertyType
        );
      } catch {
        continue;
      }
      if (!canServe) continue;

      /**
       * 4️⃣ DISTANCE CHECK
       */
      const distance = getDistanceKm(
        clientLat,
        clientLng,
        agentLat,
        agentLng
      );

      if (distance < shortestDistance) {
        shortestDistance = distance;
        selectedAgent = {
          agentId,
          redis: redisAgent,
          distance,
        };
      }
    }

    if (!selectedAgent) {
      return res.status(404).json({ error: "No available agents nearby" });
    }

    /**
     * 5️⃣ FETCH AGENT PROFILE
     */
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

    /**
     * 6️⃣ LOCK REQUEST
     */
    await redisClient.hSet(requestKey, {
      status: "offered",
      agentId: selectedAgent.agentId,
      offeredAt: Date.now().toString(),
    });

    /**
     * 7️⃣ RESPONSE
     */
    return res.json({
      message: "Request offered to agent",
      request: {
        requestId,
        clientId: requestData.clientId,
        lat: clientLat,
        lng: clientLng,
        propertyType: requestPropertyType,
      },
      agent: {
        agentId: selectedAgent.agentId,

        // Firestore profile
        name: agent.name,
        phone: agent.phone,
        email: agent.email,
        agencyName: agent.agencyName,
        licenseId: agent.licenseId,
        verified: agent.verified,

        // Redis live data
        lat: Number(selectedAgent.redis.lat),
        lng: Number(selectedAgent.redis.lng),
        load: Number(selectedAgent.redis.load || 0),
        rating: Number(selectedAgent.redis.rating || 5),

        distanceKm: Number(selectedAgent.distance.toFixed(2)),
      },
    });
  } catch (error) {
    console.error("Match error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * ===============================
 * HELPERS
 * ===============================
 */

const agentHasPropertyType = async (agentId, propertyType) => {
  const snapshot = await db
    .collection("rentalProducts")
    .where("agentId", "==", agentId)
    .where("propertyType", "==", propertyType)
    .limit(1)
    .get();

  return !snapshot.empty;
};

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
