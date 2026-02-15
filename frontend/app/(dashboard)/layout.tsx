import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { getServerUser } from "@/lib/auth-session";

const BACKEND_URL = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"
).replace(/\/+$/, "");

async function checkIsAdmin(email: string): Promise<boolean> {
  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json",
    };
    if (process.env.NEXT_PUBLIC_API_KEY) {
      headers["X-API-KEY"] = process.env.NEXT_PUBLIC_API_KEY;
    }

    const res = await fetch(
      `${BACKEND_URL}/api/users/me?email=${encodeURIComponent(email)}`,
      { headers, cache: "no-store" },
    );

    if (!res.ok) return false;
    const json = await res.json();
    return json.data?.isAdmin === true || json.data?.admin === true;
  } catch {
    return false;
  }
}

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getServerUser();
  const isAdmin = user?.email ? await checkIsAdmin(user.email) : false;

  return (
    <DashboardLayout
      isAdmin={isAdmin}
      userName={user?.name || undefined}
      userAvatarUrl={user?.image || undefined}
      userEmail={user?.email || undefined}
    >
      {children}
    </DashboardLayout>
  );
}
