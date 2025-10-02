/**
 * CORS Configuration and Middleware
 * Major Fix #16: Add proper CORS headers to API responses
 */

import { NextRequest, NextResponse } from "next/server";

export interface CorsOptions {
  origin?: string | string[] | "*";
  methods?: string[];
  allowedHeaders?: string[];
  exposedHeaders?: string[];
  credentials?: boolean;
  maxAge?: number;
}

const defaultCorsOptions: CorsOptions = {
  origin: process.env.ALLOWED_ORIGINS?.split(",") || "*",
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "Accept",
    "Origin",
  ],
  exposedHeaders: ["X-Total-Count", "X-Response-Time"],
  credentials: true,
  maxAge: 86400, // 24 hours
};

/**
 * Check if origin is allowed
 */
function isOriginAllowed(
  origin: string | null,
  allowedOrigins: string | string[] | "*",
): boolean {
  if (!origin) return false;
  if (allowedOrigins === "*") return true;
  if (typeof allowedOrigins === "string") {
    return origin === allowedOrigins;
  }
  return allowedOrigins.includes(origin);
}

/**
 * Add CORS headers to a NextResponse
 */
export function addCorsHeaders(
  response: NextResponse,
  request: NextRequest,
  options: CorsOptions = defaultCorsOptions,
): NextResponse {
  const origin = request.headers.get("origin");
  const allowedOrigins = options.origin || defaultCorsOptions.origin!;

  // Set Access-Control-Allow-Origin
  if (origin && isOriginAllowed(origin, allowedOrigins)) {
    response.headers.set("Access-Control-Allow-Origin", origin);
  } else if (allowedOrigins === "*") {
    response.headers.set("Access-Control-Allow-Origin", "*");
  }

  // Set other CORS headers
  if (options.credentials !== false) {
    response.headers.set("Access-Control-Allow-Credentials", "true");
  }

  const methods = options.methods || defaultCorsOptions.methods!;
  response.headers.set("Access-Control-Allow-Methods", methods.join(", "));

  const allowedHeaders =
    options.allowedHeaders || defaultCorsOptions.allowedHeaders!;
  response.headers.set(
    "Access-Control-Allow-Headers",
    allowedHeaders.join(", "),
  );

  const exposedHeaders =
    options.exposedHeaders || defaultCorsOptions.exposedHeaders!;
  if (exposedHeaders.length > 0) {
    response.headers.set(
      "Access-Control-Expose-Headers",
      exposedHeaders.join(", "),
    );
  }

  const maxAge = options.maxAge || defaultCorsOptions.maxAge!;
  response.headers.set("Access-Control-Max-Age", maxAge.toString());

  return response;
}

/**
 * Wrap a route handler with CORS support
 */
export function withCors(
  handler: (request: NextRequest) => Promise<NextResponse>,
  options: CorsOptions = defaultCorsOptions,
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    // Handle preflight OPTIONS request
    if (request.method === "OPTIONS") {
      const response = new NextResponse(null, { status: 204 });
      return addCorsHeaders(response, request, options);
    }

    // Handle actual request
    const response = await handler(request);
    return addCorsHeaders(response, request, options);
  };
}

/**
 * Create a CORS-enabled JSON response
 */
export function corsResponse(
  data: any,
  request: NextRequest,
  options?: {
    status?: number;
    headers?: HeadersInit;
    corsOptions?: CorsOptions;
  },
): NextResponse {
  const response = NextResponse.json(data, {
    status: options?.status || 200,
    headers: options?.headers,
  });

  return addCorsHeaders(response, request, options?.corsOptions);
}
