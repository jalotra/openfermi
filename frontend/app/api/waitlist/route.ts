import { NextResponse } from "next/server";

const BACKEND_URL = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"
).replace(/\/+$/, "");

function getBackendHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };
  const apiKey = process.env.API_KEY || process.env.NEXT_PUBLIC_API_KEY;
  if (apiKey) {
    headers["X-API-KEY"] = apiKey;
  }
  return headers;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");

    if (!email) {
      return NextResponse.json(
        { error: "email query param is required" },
        { status: 400 },
      );
    }

    const backendRes = await fetch(
      `${BACKEND_URL}/api/users/waitlist/email/${encodeURIComponent(email)}`,
      {
        headers: getBackendHeaders(),
        cache: "no-store",
      },
    );

    if (backendRes.ok) {
      return NextResponse.json({ exists: true });
    }

    if (backendRes.status === 404) {
      return NextResponse.json({ exists: false });
    }

    const backendErr = await backendRes.json().catch(() => null);
    return NextResponse.json(
      { error: backendErr?.message || "Failed to check waitlist status" },
      { status: backendRes.status || 502 },
    );
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, name, message } = body ?? {};

    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "email is required" }, { status: 400 });
    }

    const backendRes = await fetch(`${BACKEND_URL}/api/users/waitlist`, {
      method: "POST",
      headers: getBackendHeaders(),
      body: JSON.stringify({ email, name, message }),
      cache: "no-store",
    });

    const data = await backendRes.json().catch(() => null);
    if (!backendRes.ok) {
      return NextResponse.json(
        { error: data?.message || "Failed to submit waitlist request" },
        { status: backendRes.status || 502 },
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 },
    );
  }
}
