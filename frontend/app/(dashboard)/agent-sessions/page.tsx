import { columns } from "./columns";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";
import { AxiosError } from "axios";
import { AgentSessionController } from "@/lib/backend/sdk.gen";
import { backendClient } from "@/lib/backend-client";
import type { AgentSessionDto } from "@/lib/backend/types.gen";
import { getServerUser } from "@/lib/auth-session";

export const dynamic = "force-dynamic";

export default async function AgentSessionsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const page = (params.pageNumber as string) || "0";
  const size = (params.pageSize as string) || "10";

  const user = await getServerUser();
  const userId = user?.id || user?.email || null;

  let sessions: AgentSessionDto[] = [];
  let error: string | null = null;

  try {
    if (userId) {
      const response = await AgentSessionController.getByUserId({
        client: backendClient,
        path: { userId },
      });
      sessions = response.data?.data || [];
    } else {
      const response = await AgentSessionController.read1({
        client: backendClient,
        query: { page, size },
      });
      sessions = response.data?.data || [];
    }
  } catch (err) {
    if (err instanceof AxiosError) {
      error =
        err.response?.data?.message ||
        err.message ||
        "Failed to fetch agent sessions";
    } else {
      error =
        err instanceof Error ? err.message : "Failed to fetch agent sessions";
    }
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-auto bg-background">
      <div className="p-8 space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Agent Sessions
            </h1>
            <p className="text-muted-foreground">
              {sessions.length > 0
                ? `You have ${sessions.length} agent session${sessions.length !== 1 ? "s" : ""}`
                : "Start a new agent session to get AI-powered help."}
            </p>
          </div>
          <Link href="/agent-sessions/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Agent Session
            </Button>
          </Link>
        </div>

        {error ? (
          <div className="p-4 bg-destructive/10 border border-destructive/30 rounded-lg">
            <p className="text-destructive">{error}</p>
          </div>
        ) : sessions.length === 0 ? (
          <div className="p-8 text-center border-2 border-dashed rounded-lg">
            <p className="text-muted-foreground mb-2">No agent sessions yet</p>
            <p className="text-sm text-muted-foreground">
              Click &quot;New Agent Session&quot; to start an AI agent that can
              help you with STEM problems
            </p>
          </div>
        ) : (
          <DataTable<AgentSessionDto, string>
            columns={columns}
            data={sessions}
            serverPaginated
            previousPageUrl={
              Number(page) > 0
                ? `/agent-sessions?pageNumber=${Number(page) - 1}&pageSize=${size}`
                : undefined
            }
            nextPageUrl={
              sessions.length >= Number(size)
                ? `/agent-sessions?pageNumber=${Number(page) + 1}&pageSize=${size}`
                : undefined
            }
            filterColumn="state"
            rowLinkPrefix="/agent-sessions"
          />
        )}
      </div>
    </div>
  );
}
