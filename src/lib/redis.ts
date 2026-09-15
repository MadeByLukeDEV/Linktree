import Redis from "ioredis";

declare global {
  var _redis: Redis | undefined;
}

function createClient() {
  const url = process.env.REDIS_URL;
  if (!url) {
    throw new Error("REDIS_URL is not set");
  }
  return new Redis(url);
}

export const redis = globalThis._redis ?? createClient();

if (process.env.NODE_ENV !== "production") {
  globalThis._redis = redis;
}
