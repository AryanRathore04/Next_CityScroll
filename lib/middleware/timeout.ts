/**
 * Request Timeout Middleware
 * Ensures API requests complete within a specified time limit
 * Major Fix #17: Add request timeouts to prevent hung requests
 */

import { NextRequest, NextResponse } from "next/server";
import { serverLogger as logger } from "@/lib/logger";

export interface TimeoutOptions {
  timeoutMs: number; // Timeout in milliseconds
  message?: string; // Custom timeout message
}

/**
 * Wraps a Next.js route handler with timeout protection
 * @param handler - The route handler function
 * @param options - Timeout configuration
 */
export function withTimeout(
  handler: (request: NextRequest) => Promise<NextResponse>,
  options: TimeoutOptions = { timeoutMs: 30000 }, // Default 30 seconds
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const timeoutMessage =
      options.message || "Request timeout - operation took too long";

    // Create a timeout promise
    const timeoutPromise = new Promise<NextResponse>((_, reject) => {
      setTimeout(() => {
        reject(new Error("TIMEOUT"));
      }, options.timeoutMs);
    });

    try {
      // Race between the handler and timeout
      const response = await Promise.race([handler(request), timeoutPromise]);

      return response;
    } catch (error) {
      if (error instanceof Error && error.message === "TIMEOUT") {
        logger.warn("Request timeout occurred", {
          url: request.url,
          method: request.method,
          timeoutMs: options.timeoutMs,
        });

        return NextResponse.json(
          {
            error: timeoutMessage,
            code: "REQUEST_TIMEOUT",
            timestamp: new Date().toISOString(),
          },
          { status: 504 }, // Gateway Timeout
        );
      }

      // Re-throw other errors
      throw error;
    }
  };
}

/**
 * Middleware for database operations with timeout
 * Use this for wrapping database queries
 */
export async function withDbTimeout<T>(
  operation: () => Promise<T>,
  timeoutMs: number = 10000, // Default 10 seconds for DB operations
): Promise<T> {
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => {
      reject(new Error("DATABASE_TIMEOUT"));
    }, timeoutMs);
  });

  try {
    return await Promise.race([operation(), timeoutPromise]);
  } catch (error) {
    if (error instanceof Error && error.message === "DATABASE_TIMEOUT") {
      logger.error("Database operation timeout", { timeoutMs });
      throw new Error("Database operation timed out");
    }
    throw error;
  }
}
