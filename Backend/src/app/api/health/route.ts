import { NextResponse } from "next/server";
import { prisma } from "@/infrastructure/database/prisma.client";

/**
 * GET /api/health
 * Health check endpoint — verifies database connectivity
 */
export async function GET() {
  const health: Record<string, unknown> = {
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
  };

  // Check database connectivity
  try {
    await prisma.$queryRaw`SELECT 1`;
    health.database = { status: "connected" };
  } catch (error) {
    health.database = {
      status: "disconnected",
      error: error instanceof Error ? error.message : "Unknown error",
    };
    health.status = "degraded";
  }

  // Check Redis connectivity
  try {
    const { getRedisClient } = await import("@/infrastructure/cache/redis.client");
    const redis = getRedisClient();
    if (redis) {
      await redis.ping();
      health.redis = { status: "connected" };
    } else {
      health.redis = { status: "not_configured" };
    }
  } catch (error) {
    health.redis = {
      status: "disconnected",
      error: error instanceof Error ? error.message : "Unknown error",
    };
    health.status = "degraded";
  }

  const statusCode = health.status === "ok" ? 200 : 503;
  return NextResponse.json(health, { status: statusCode });
}
