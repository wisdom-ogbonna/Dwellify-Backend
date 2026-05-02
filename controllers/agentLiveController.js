import redisClient from "../config/redis.js";

export const getAgentLiveData = async (req, res) => {
  try {
    const { agentId } = req.params;

    if (!agentId) {
      return res.status(400).json({ error: "Missing agentId" });
    }

    const locationKey = `agent:location:${agentId}`;
    const statusKey = `agent:status:${agentId}`;
    const currentKey = `agent:current:${agentId}`; // 🔥 ADD THIS

    // 🔹 Get location data
    const locationData = await redisClient.hGetAll(locationKey);

    if (!locationData || Object.keys(locationData).length === 0) {
      return res.status(404).json({ error: "Agent not found or offline" });
    }

    // 🔹 Get status
    const status = await redisClient.get(statusKey);

    // 🔹 Get current request (🔥 NEW)
    const currentData = await redisClient.hGetAll(currentKey);

    return res.json({
      agentId,
      isOnline: locationData.isOnline === "true",
      lat: locationData.lat ? Number(locationData.lat) : null,
      lng: locationData.lng ? Number(locationData.lng) : null,
      load: Number(locationData.load || 0),
      rating: Number(locationData.rating || 5),
      updatedAt: Number(locationData.updatedAt),
      status: status || "available",

      // 🔥 ADD REQUEST INFO HERE
      requestId: currentData?.requestId || null,
      clientId: currentData?.clientId || null,
      requestStatus: currentData?.status || null,
    });

  } catch (err) {
    console.error("❌ getAgentLiveData error:", err);
    return res.status(500).json({ error: "Server error" });
  }
};