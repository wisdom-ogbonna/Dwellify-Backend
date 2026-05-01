import redisClient from "../config/redis.js";

export const getClientLiveData = async (req, res) => {
  try {
    const { clientId } = req.params;

    const key = `client:location:${clientId}`;
    const data = await redisClient.hGetAll(key);

    if (!data || Object.keys(data).length === 0) {
      return res.status(404).json({ error: "Client not found" });
    }

    return res.json({
      clientId,
      lat: data.lat ? Number(data.lat) : null,
      lng: data.lng ? Number(data.lng) : null,
      updatedAt: Number(data.updatedAt),
    });

  } catch (err) {
    console.error("Client live error:", err);
    return res.status(500).json({ error: "Server error" });
  }
};