import { NextResponse } from "next/server";
import { Resend } from "resend";
import { InviteEmail } from "@/components/emails/InviteEmail";
import { getServerUser } from "@/lib/auth-session";

const BACKEND_URL = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"
).replace(/\/+$/, "");

const APP_URL = (
  process.env.BETTER_AUTH_URL || "http://localhost:3000"
).replace(/\/+$/, "");

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

async function isAdmin(email: string): Promise<boolean> {
  try {
    const res = await fetch(
      `${BACKEND_URL}/api/users/me?email=${encodeURIComponent(email)}`,
      { headers: getBackendHeaders(), cache: "no-store" },
    );
    if (!res.ok) return false;
    const json = await res.json();
    return json.data?.isAdmin === true || json.data?.admin === true;
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  try {
    const user = await getServerUser();
    if (!user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!(await isAdmin(user.email))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { email } = body;

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { error: "email is required" },
        { status: 400 },
      );
    }

    if (!process.env.RESEND_API_KEY || !process.env.RESEND_FROM_EMAIL) {
      return NextResponse.json(
        { error: "Email service not configured (RESEND_API_KEY / RESEND_FROM_EMAIL missing)" },
        { status: 500 },
      );
    }

    const resend = new Resend(process.env.RESEND_API_KEY);
    const loginUrl = `${APP_URL}/auth/login`;

    const { error: emailError } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL,
      to: email,
      subject: "You're invited to OpenFermi!",
      react: InviteEmail({ email, loginUrl }),
    });

    if (emailError) {
      console.error("Resend invite email error:", emailError);
      return NextResponse.json(
        { error: "Failed to send invite email" },
        { status: 502 },
      );
    }

    const backendRes = await fetch(`${BACKEND_URL}/api/users/invite`, {
      method: "POST",
      headers: getBackendHeaders(),
      body: JSON.stringify({ email }),
    });

    if (!backendRes.ok) {
      const data = await backendRes.json().catch(() => null);
      console.error("Backend invite failed (email was sent):", data);
      return NextResponse.json(
        { error: data?.message || "Backend invite failed, but email was sent" },
        { status: 502 },
      );
    }

    const backendData = await backendRes.json();
    return NextResponse.json({ success: true, data: backendData.data });
  } catch (err) {
    console.error("Error in /api/email/invite:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 },
    );
  }
}
