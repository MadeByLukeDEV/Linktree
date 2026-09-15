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
    // The app's Redis ACL user has no permission for INFO, which ioredis's
    // ready check calls by default -- disable it rather than let every
    // connection log a NOPERM warning.
    enableReadyCheck: false,
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
