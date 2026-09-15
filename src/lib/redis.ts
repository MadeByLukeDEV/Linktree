import Redis from "ioredis";

declare global {
  var _redis: Redis | undefined;
}

function createClient() {
  const url = process.env.REDIS_URL;
  if (!url) {
    throw new Error("REDIS_URL is not set");
  }
  const client = new Redis(url, {
    maxRetriesPerRequest: 2,
    retryStrategy: (times) => Math.min(times * 500, 10_000),
  });
  client.on("error", (error) => {
    console.error("Redis connection error:", error.message);
  });
  return client;
}

export const redis = globalThis._redis ?? createClient();

if (process.env.NODE_ENV !== "production") {
  globalThis._redis = redis;
}
