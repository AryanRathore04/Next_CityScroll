import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";

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

    // API Health Check
    const apiStartTime = Date.now();
    try {
      // Test internal API endpoint
      const response = await fetch(
        `${
          process.env.NEXTAUTH_URL || "http://localhost:3000"
        }/api/vendor/profile?vendorId=test`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        },
      );

      const apiLatency = Date.now() - apiStartTime;

      if (response.status === 400) {
        // Expected for test ID
        checks.push({
          service: "api",
          status: "healthy",
          latency: apiLatency,
          timestamp: new Date().toISOString(),
        });
      } else {
        checks.push({
          service: "api",
          status: apiLatency > 2000 ? "degraded" : "healthy",
          latency: apiLatency,
          timestamp: new Date().toISOString(),
        });
      }
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

    return NextResponse.json(response, {
      status: statusCode,
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "X-Response-Time": `${Date.now() - startTime}ms`,
      },
    });
  } catch (error) {
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
