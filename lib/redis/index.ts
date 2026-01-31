import Redis from "ioredis";

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

// Create a singleton Redis client
function createRedisClient() {
  const client = new Redis(REDIS_URL, {
    maxRetriesPerRequest: 3,
    retryStrategy(times) {
      // Exponential backoff with max 3 seconds
      const delay = Math.min(times * 100, 3000);
      return delay;
    },
    lazyConnect: true,
  });

  client.on("error", (error) => {
    console.error("Redis connection error:", error.message);
  });

  client.on("connect", () => {
    console.log("Redis connected");
  });

  return client;
}

// Global singleton to prevent multiple connections in development
const globalForRedis = globalThis as unknown as {
  redis: Redis | undefined;
};

export const redis = globalForRedis.redis ?? createRedisClient();

if (process.env.NODE_ENV !== "production") {
  globalForRedis.redis = redis;
}

// Helper to check if Redis is available
export async function isRedisAvailable(): Promise<boolean> {
  try {
    await redis.ping();
    return true;
  } catch {
    return false;
  }
}
