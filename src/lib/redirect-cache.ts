import { redis } from "@/lib/redis";

export function redirectCacheKey(subdomain: string) {
  return `redirect:${subdomain}`;
}

export async function invalidateRedirectCache(subdomain: string) {
  try {
    await redis.del(redirectCacheKey(subdomain));
  } catch (error) {
    // Redis is a cache, not the source of truth -- a failed invalidation
    // (e.g. Redis briefly unreachable) must never fail the write that
    // triggered it. Worst case the old target keeps serving until the key's
    // TTL expires.
    console.error("Failed to invalidate redirect cache:", error);
  }
}
