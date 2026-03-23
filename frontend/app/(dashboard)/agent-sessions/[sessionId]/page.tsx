import { AgentSessionController } from "@/lib/backend/sdk.gen";
import { backendClient } from "@/lib/backend-client";
import type { AgentSessionDto } from "@/lib/backend/types.gen";
import { AxiosError } from "axios";
import { AgentSessionLiveView } from "./AgentSessionLiveView";

export const dynamic = "force-dynamic";

export default async function AgentSessionDetailPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;

  let session: AgentSessionDto | null = null;
  let error: string | null = null;

  try {
    const response = await AgentSessionController.get1({
      client: backendClient,
      path: { id: sessionId },
    });
    session = response.data?.data || null;
  } catch (err) {
    if (err instanceof AxiosError) {
      error =
        err.response?.data?.message || err.message || "Failed to fetch session";
    } else {
      error = err instanceof Error ? err.message : "Failed to fetch session";
    }
  }

  if (error || !session) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background">
        <div className="p-4 bg-destructive/10 border border-destructive/30 rounded-lg">
          <p className="text-destructive">{error || "Session not found"}</p>
        </div>
      </div>
    );
  }

  return <AgentSessionLiveView initialSession={session} />;
}
