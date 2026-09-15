import { redis } from "@/lib/redis";
import { redirectCacheKey } from "@/lib/redirect-cache";
import * as socialLinksService from "@/modules/social-links/service";

const CACHE_TTL_SECONDS = 300;

export async function resolveSubdomain(subdomain: string): Promise<string | null> {
  try {
    const cached = await redis.get(redirectCacheKey(subdomain));
    if (cached) {
      return cached;
    }
  } catch (error) {
    console.error("Redirect cache lookup failed, falling back to DB:", error);
  }

  const link = await socialLinksService.getBySubdomain(subdomain);
  if (!link) {
    return null;
  }

  try {
    await redis.set(redirectCacheKey(subdomain), link.url, "EX", CACHE_TTL_SECONDS);
  } catch (error) {
    console.error("Failed to cache redirect:", error);
  }

  return link.url;
}
