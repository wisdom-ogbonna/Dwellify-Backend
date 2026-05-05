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
      return res.json({
        agentId,
        isOnline: false,
        lat: null,
        lng: null,
        load: 0,
        rating: 5,
        updatedAt: null,
        status: "offline",
        requestId: null,
        clientId: null,
        requestStatus: null,
      });
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
