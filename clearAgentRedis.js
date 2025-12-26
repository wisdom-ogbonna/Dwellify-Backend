import redisClient from "./config/redis.js";

await redisClient.del("agent:location:fg8NNhmI5JVFY8IjolKeqS6AGB62");

console.log("Agent Redis cleared");
process.exit(0);
