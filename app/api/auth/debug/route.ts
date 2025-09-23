import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not available" }, { status: 404 });
  }

  const headers: Record<string, string | null> = {};
  request.headers.forEach((value, key) => {
    headers[key] = value;
  });

  const rawBody = await request.text();

  return NextResponse.json({
    ok: true,
    headers,
    rawBody,
  });
}
