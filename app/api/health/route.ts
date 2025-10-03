import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { serverLogger as logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

interface HealthCheck {
  service: string;
  status: "healthy" | "degraded" | "down";
  latency?: number;
  error?: string;
  timestamp: string;
}

interface SystemHealth {
  overall: "healthy" | "degraded" | "down";
  checks: HealthCheck[];
  uptime: number;
  version: string;
}

export async function GET() {
  const startTime = Date.now();
  const checks: HealthCheck[] = [];

  try {
    // Database Health Check
    const dbStartTime = Date.now();
    try {
      await connectDB();
      const User = (await import("../../../models/User")).default;
      await User.findOne({}).limit(1);

      checks.push({
        service: "database",
        status: "healthy",
        latency: Date.now() - dbStartTime,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      checks.push({
        service: "database",
        status: "down",
        error: (error as Error).message,
        timestamp: new Date().toISOString(),
      });
    }

    // API Health Check (basic check without external calls)
    const apiStartTime = Date.now();
    try {
      // Simple check - if we got here, API is running
      const apiLatency = Date.now() - apiStartTime;
      checks.push({
        service: "api",
        status: "healthy",
        latency: apiLatency,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      checks.push({
        service: "api",
        status: "down",
        error: (error as Error).message,
        timestamp: new Date().toISOString(),
      });
    }

    // Authentication Health Check
    const authStartTime = Date.now();
    try {
      // Check if auth service is available by testing JWT utilities
      const jwt = require("jsonwebtoken");
      const testToken = jwt.sign(
        { userId: "test" },
        process.env.JWT_SECRET || "test-secret",
        { expiresIn: "1m" },
      );
      jwt.verify(testToken, process.env.JWT_SECRET || "test-secret");

      const authLatency = Date.now() - authStartTime;
      checks.push({
        service: "authentication",
        status: "healthy",
        latency: authLatency,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      checks.push({
        service: "authentication",
        status: "down",
        error: (error as Error).message,
        timestamp: new Date().toISOString(),
      });
    }

    // External Services Health Check
    const extStartTime = Date.now();
    try {
      // You can add checks for payment gateways, email services, etc.
      const extLatency = Date.now() - extStartTime;
      checks.push({
        service: "external_services",
        status: "healthy",
        latency: extLatency,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      checks.push({
        service: "external_services",
        status: "degraded",
        error: (error as Error).message,
        timestamp: new Date().toISOString(),
      });
    }

    // Determine overall health
    const hasDown = checks.some((check) => check.status === "down");
    const hasDegraded = checks.some((check) => check.status === "degraded");

    let overall: "healthy" | "degraded" | "down";
    if (hasDown) {
      overall = "down";
    } else if (hasDegraded) {
      overall = "degraded";
    } else {
      overall = "healthy";
    }

    const response: SystemHealth = {
      overall,
      checks,
      uptime: process.uptime ? process.uptime() : 0,
      version: process.env.npm_package_version || "1.0.0",
    };

    const statusCode =
      overall === "healthy" ? 200 : overall === "degraded" ? 200 : 503;

    logger.info("Health check completed", {
      overall,
      totalChecks: checks.length,
      duration: Date.now() - startTime,
    });

    return NextResponse.json(response, {
      status: statusCode,
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "X-Response-Time": `${Date.now() - startTime}ms`,
      },
    });
  } catch (error) {
    logger.error("Health check failed", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });

    return NextResponse.json(
      {
        overall: "down",
        checks: [
          {
            service: "health_check",
            status: "down",
            error: (error as Error).message,
            timestamp: new Date().toISOString(),
          },
        ],
        uptime: 0,
        version: "unknown",
        code: "HEALTH_CHECK_FAILED",
        timestamp: new Date().toISOString(),
      },
      { status: 503 },
    );
  }
}
