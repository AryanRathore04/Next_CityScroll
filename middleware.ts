import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  // Add CORS headers for API routes
  if (request.nextUrl.pathname.startsWith("/api/")) {
    const response = NextResponse.next();

    // Set CORS headers
    response.headers.set(
      "Access-Control-Allow-Origin",
      process.env.NODE_ENV === "development" ? "*" : "https://yourdomain.com",
    );
    response.headers.set(
      "Access-Control-Allow-Methods",
      "GET, POST, PUT, DELETE, OPTIONS",
    );
    response.headers.set(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization",
    );
    response.headers.set("Access-Control-Max-Age", "86400");

    // Handle preflight requests
    if (request.method === "OPTIONS") {
      return new NextResponse(null, { status: 200, headers: response.headers });
    }

    return response;
  }

  // Add security headers to all responses
  const response = NextResponse.next();

  // Add cache control for static assets
  if (request.nextUrl.pathname.startsWith("/_next/static/")) {
    response.headers.set(
      "Cache-Control",
      "public, immutable, max-age=31536000",
    );
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
