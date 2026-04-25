import redisClient from "../config/redis.js";
import { db } from "../config/firebase.js";

/**
 * ACCEPT REQUEST
 */


// ✅ PROPERTY PRICES
const PROPERTY_PRICES = {
  Apartment: 4000,
  Shortlet: 5000,
  Hotel: 2000,
};

// ✅ 20% CALCULATOR
const calculateInspectionFee = (propertyType) => {
  const price = PROPERTY_PRICES[propertyType] || 0;
  return Math.floor(price * 0.2); // 20%
};
export const acceptClientRequest = async (req, res) => {
  try {
    const agentId = req.user.uid;
    const { requestId } = req.body;

    if (!agentId || !requestId) {
      return res.status(400).json({ error: "Missing fields" });
    }
    // ❌ BLOCK IF SUSPENDED
    const isSuspended = await redisClient.get(`agent:suspended:${agentId}`);
    if (isSuspended === "true") {
      return res.status(403).json({
        error: "Account suspended. Please make payment.",
      });
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
    const agentId = req.user.uid;
    const {requestId } = req.body;

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
    const agentId = req.user.uid;
    const { requestId } = req.body;
    const isSuspended = await redisClient.get(`agent:suspended:${agentId}`);
    if (isSuspended === "true") {
      return res.status(403).json({
        error: "Account suspended. Please pay to continue.",
      });
    }
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
    const agentId = req.user.uid;
    const { requestId } = req.body;

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

/**
 * ✅ COUNT INSPECTIONS
 */
const inspectionCount = await redisClient.incr(
  `agent:inspectionCount:${agentId}`
);

// ✅ GET PROPERTY TYPE
const propertyType = request.propertyType;

// ✅ CALCULATE FEE (20%)
const inspectionFee = calculateInspectionFee(propertyType);

// ✅ ADD TO TOTAL DUE
const currentDue =
  Number(await redisClient.get(`agent:paymentDue:${agentId}`)) || 0;

const newDue = currentDue + inspectionFee;

// SAVE NEW TOTAL
await redisClient.set(`agent:paymentDue:${agentId}`, newDue);
console.log("Inspection count:", inspectionCount);

/**
 * ✅ SUSPEND AFTER 3
 */
if (inspectionCount >= 3) {
  await redisClient.set(`agent:suspended:${agentId}`, "true");
  await redisClient.set(`agent:status:${agentId}`, "suspended");

  const totalDue = await redisClient.get(
    `agent:paymentDue:${agentId}`
  );

  return res.json({
    message: "Inspection completed. Account suspended. Please pay.",
    suspended: true,
    inspectionCount,
    amountToPay: Number(totalDue), // ✅ SHOW TOTAL
  });
}

return res.json({
  message: "Inspection completed",
  requestId,
  inspectionCount,
  inspectionFee, // ✅ current job fee
  totalDue: newDue, // ✅ running total
});
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
};
