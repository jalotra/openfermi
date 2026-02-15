import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie, getCookieCache } from "better-auth/cookies";

const BACKEND_URL = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"
).replace(/\/+$/, "");

const protectedPaths = [
  "/dashboard",
  "/questions",
  "/sessions",
  "/learn",
  "/learning-sessions",
  "/admin",
  "/api/questions",
];

function getBackendHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };
  if (process.env.NEXT_PUBLIC_API_KEY) {
    headers["X-API-KEY"] = process.env.NEXT_PUBLIC_API_KEY;
  }
  return headers;
}

async function checkUserApproved(email: string): Promise<boolean> {
  try {
    const res = await fetch(
      `${BACKEND_URL}/api/users/me?email=${encodeURIComponent(email)}`,
      { headers: getBackendHeaders(), cache: "no-store" },
    );
    if (!res.ok) return false;
    const json = await res.json();
    return json.data?.isApproved === true || json.data?.approved === true;
  } catch {
    return false;
  }
}

export async function proxy(request: NextRequest) {
  const sessionCookie = getSessionCookie(request);

  const isProtectedPath = protectedPaths.some((path) =>
    request.nextUrl.pathname.startsWith(path),
  );

  if (isProtectedPath && !sessionCookie) {
    const loginUrl = new URL("/auth/login", request.url);
    loginUrl.searchParams.set("callbackUrl", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isProtectedPath && sessionCookie) {
    const cached = await getCookieCache(request, {
      secret: process.env.BETTER_AUTH_SECRET,
      strategy: "jwt",
    });

    const email = cached?.user?.email;
    if (email) {
      const approved = await checkUserApproved(email);
      if (!approved) {
        const notApprovedUrl = new URL("/auth/not-approved", request.url);
        notApprovedUrl.searchParams.set("email", email);
        notApprovedUrl.searchParams.set("name", cached?.user?.name || "");
        return NextResponse.redirect(notApprovedUrl);
      }
    }
  }

  if (request.nextUrl.pathname.startsWith("/auth/login") && sessionCookie) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/questions/:path*",
    "/sessions/:path*",
    "/learn/:path*",
    "/learning-sessions/:path*",
    "/admin/:path*",
    "/auth/login",
  ],
};
