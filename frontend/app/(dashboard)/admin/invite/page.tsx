import { getServerUser } from "@/lib/auth-session";
import { redirect } from "next/navigation";
import { AdminInviteClient } from "./AdminInviteClient";

export const dynamic = "force-dynamic";

const BACKEND_URL = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"
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

export default async function AdminInvitePage() {
  const user = await getServerUser();
  if (!user?.email) redirect("/auth/login");

  const headers = getBackendHeaders();

  const meRes = await fetch(
    `${BACKEND_URL}/api/users/me?email=${encodeURIComponent(user.email)}`,
    { headers, cache: "no-store" },
  );

  if (!meRes.ok) redirect("/");

  const meJson = await meRes.json();
  const isAdmin = meJson.data?.isAdmin === true || meJson.data?.admin === true;
  if (!isAdmin) redirect("/");

  let waitlistRequests: any[] = [];
  try {
    const wlRes = await fetch(
      `${BACKEND_URL}/api/users/waitlist?status=PENDING`,
      {
        headers,
        cache: "no-store",
      },
    );
    if (wlRes.ok) {
      const wlJson = await wlRes.json();
      waitlistRequests = wlJson.data || [];
    }
  } catch {
    // ignore
  }

  return (
    <div className="flex-1 min-h-0 overflow-auto bg-gray-50/50 p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Invite Users</h1>
          <p className="text-muted-foreground mt-1">
            Invite new users by email or approve waitlist requests.
          </p>
        </div>

        <AdminInviteClient initialWaitlist={waitlistRequests} />
      </div>
    </div>
  );
}
