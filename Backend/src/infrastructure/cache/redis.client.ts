import { Redis } from "@upstash/redis";

let redis: Redis | null = null;

/**
 * Get Upstash Redis client (lazy singleton).
 * Returns null if Upstash credentials are not configured.
 */
export function getRedisClient(): Redis | null {
  if (redis) return redis;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    return null;
  }

  redis = new Redis({ url, token });
  return redis;
}
