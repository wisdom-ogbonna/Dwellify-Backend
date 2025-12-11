// config/redis.js
import { createClient } from "redis";

const REDIS_URL = process.env.REDIS_URL || "redis://127.0.0.1:6379";

const redisClient = createClient({ url: REDIS_URL });

redisClient.on("connect", () => console.log("✅ Redis connecting..."));
redisClient.on("ready", () => console.log("✅ Redis ready"));
redisClient.on("error", (err) => console.error("❌ Redis error:", err));

await redisClient.connect();

export default redisClient;
