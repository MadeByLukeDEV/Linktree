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

// Constructed lazily, on first real use, rather than at module load -- see
// the matching comment in src/lib/prisma.ts. Next.js imports this module
// during `next build`'s page-data-collection step, which runs without
// REDIS_URL available in a Docker build.
function getRedisClient(): Redis {
  if (!globalThis._redis) {
    globalThis._redis = createClient();
  }
  return globalThis._redis;
}

export const redis = new Proxy({} as Redis, {
  get(_target, prop) {
    const client = getRedisClient();
    const value = Reflect.get(client, prop, client);
    return typeof value === "function" ? value.bind(client) : value;
  },
});
