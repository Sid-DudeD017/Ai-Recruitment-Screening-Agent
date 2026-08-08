import { getRedisClient } from "./redis.client";
import { createModuleLogger } from "@/shared/utils/logger";

const logger = createModuleLogger("cache");

/**
 * Generic cache service backed by Upstash Redis.
 * Degrades gracefully — if Redis is unavailable, operations are no-ops.
 */
export const cacheService = {
  /**
   * Get a cached value by key
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const redis = getRedisClient();
      if (!redis) return null;

      const value = await redis.get<T>(key);
      return value;
    } catch (error) {
      logger.warn({ key, error }, "Cache get failed");
      return null;
    }
  },

  /**
   * Set a cached value with TTL (in seconds)
   */
  async set<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
    try {
      const redis = getRedisClient();
      if (!redis) return;

      await redis.set(key, value, { ex: ttlSeconds });
    } catch (error) {
      logger.warn({ key, error }, "Cache set failed");
    }
  },

  /**
   * Delete a cached value
   */
  async del(key: string): Promise<void> {
    try {
      const redis = getRedisClient();
      if (!redis) return;

      await redis.del(key);
    } catch (error) {
      logger.warn({ key, error }, "Cache delete failed");
    }
  },

  /**
   * Invalidate multiple keys matching a pattern prefix
   * Note: Upstash doesn't support SCAN, so we delete known keys explicitly
   */
  async invalidatePrefix(prefix: string, keys: string[]): Promise<void> {
    try {
      const redis = getRedisClient();
      if (!redis) return;

      const matchingKeys = keys.filter((k) => k.startsWith(prefix));
      if (matchingKeys.length > 0) {
        await Promise.all(matchingKeys.map((k) => redis.del(k)));
      }
    } catch (error) {
      logger.warn({ prefix, error }, "Cache invalidation failed");
    }
  },

  /**
   * Get or set — returns cached value if exists, otherwise calls fn and caches result
   */
  async getOrSet<T>(
    key: string,
    ttlSeconds: number,
    fn: () => Promise<T>
  ): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    const value = await fn();
    await this.set(key, value, ttlSeconds);
    return value;
  },
};
