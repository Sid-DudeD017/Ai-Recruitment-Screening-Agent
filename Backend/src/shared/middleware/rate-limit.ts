import { NextRequest, NextResponse } from "next/server";
import { Ratelimit } from "@upstash/ratelimit";
import { getRedisClient } from "@/infrastructure/cache/redis.client";
import { errorResponse } from "@/shared/utils/api-response";
import { createModuleLogger } from "@/shared/utils/logger";

const logger = createModuleLogger("rate-limit");

type RateLimitConfig = {
  /** Max requests allowed in the window */
  requests: number;
  /** Window duration string e.g. "1m", "10s", "1h" */
  window: `${number}${"s" | "m" | "h" | "d"}`;
};

/**
 * Create a rate limiter instance.
 * Returns null if Redis is not configured (rate limiting is skipped).
 */
function createRateLimiter(config: RateLimitConfig): Ratelimit | null {
  const redis = getRedisClient();
  if (!redis) return null;

  return new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(config.requests, config.window),
    analytics: true,
    prefix: "ratelimit",
  });
}

// Pre-configured limiters
const limiters = {
  general: () => createRateLimiter({ requests: 100, window: "1m" }),
  ai: () => createRateLimiter({ requests: 10, window: "1m" }),
  auth: () => createRateLimiter({ requests: 20, window: "1m" }),
  upload: () => createRateLimiter({ requests: 5, window: "1m" }),
};

export type RateLimitTier = keyof typeof limiters;

/**
 * Rate limit a request by identifier (usually userId or IP).
 * Returns a NextResponse if rate limited, or null if allowed.
 */
export async function checkRateLimit(
  req: NextRequest,
  identifier: string,
  tier: RateLimitTier = "general"
): Promise<NextResponse | null> {
  const limiter = limiters[tier]();
  if (!limiter) return null; // Redis not configured, skip

  try {
    const { success, limit, remaining, reset } = await limiter.limit(identifier);

    if (!success) {
      logger.warn({ identifier, tier, limit, remaining }, "Rate limit exceeded");
      const response = errorResponse(
        "Too many requests. Please try again later.",
        429,
        "RATE_LIMIT_EXCEEDED"
      );
      response.headers.set("X-RateLimit-Limit", String(limit));
      response.headers.set("X-RateLimit-Remaining", String(remaining));
      response.headers.set("X-RateLimit-Reset", String(reset));
      response.headers.set("Retry-After", String(Math.ceil((reset - Date.now()) / 1000)));
      return response;
    }

    return null; // Allowed
  } catch (error) {
    // Rate limiting should never break requests
    logger.error({ error, identifier, tier }, "Rate limit check failed");
    return null;
  }
}
