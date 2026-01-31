import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

export async function proxy(request: NextRequest) {
  const sessionCookie = getSessionCookie(request);
  
  // Define protected routes that require authentication
  const protectedPaths = [
    "/dashboard",
    "/questions",
    "/sessions",
    "/api/questions", // Protect API routes if needed
  ];
  
  // Check if current path is protected
  const isProtectedPath = protectedPaths.some(path => 
    request.nextUrl.pathname.startsWith(path)
  );
  
  // If accessing protected route without session, redirect to login
  if (isProtectedPath && !sessionCookie) {
    const loginUrl = new URL("/auth/login", request.url);
    loginUrl.searchParams.set("callbackUrl", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }
  
  // If accessing auth pages with valid session, redirect to dashboard
  if (request.nextUrl.pathname.startsWith("/auth/login") && sessionCookie) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/questions/:path*",
    "/sessions/:path*",
    "/auth/login",
  ],
};
