import redisClient from "../config/redis.js";

export const payAndReactivateAgent = async (req, res) => {
  try {
    const { agentId } = req.body;

    if (!agentId) {
      return res.status(400).json({ error: "Missing agentId" });
    }

    // ✅ REMOVE SUSPENSION
    await redisClient.del(`agent:suspended:${agentId}`);

    // ✅ RESET COUNT
    await redisClient.del(`agent:inspectionCount:${agentId}`);

    // ✅ BACK ONLINE
    await redisClient.set(`agent:status:${agentId}`, "online");

    return res.json({
      message: "Payment successful. Account reactivated.",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Payment failed" });
  }
};