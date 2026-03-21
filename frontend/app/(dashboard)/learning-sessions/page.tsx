import { columns, type LearningSessionRow } from "./columns";
import { DataTable } from "@/components/ui/data-table";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

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

interface TutorMap {
  [id: string]: string;
}

export default async function LearningSessionsPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const { questionId } = await searchParams;
  const qId = questionId as string | undefined;

  const headers = getBackendHeaders();

  let sessions: LearningSessionRow[] = [];
  let error: string | null = null;

  try {
    const url = qId
      ? `${BACKEND_URL}/learning-sessions/question/${qId}`
      : `${BACKEND_URL}/learning-sessions`;

    const res = await fetch(url, { headers, cache: "no-store" });
    if (!res.ok) throw new Error("Failed to fetch learning sessions");
    const json = await res.json();
    sessions = json.data || [];
  } catch (err) {
    error =
      err instanceof Error ? err.message : "Failed to fetch learning sessions";
  }

  const tutorIds = [...new Set(sessions.map((s) => s.tutorId).filter(Boolean))];
  const tutorMap: TutorMap = {};

  if (tutorIds.length > 0) {
    const tutorFetches = tutorIds.map(async (id) => {
      try {
        const res = await fetch(`${BACKEND_URL}/tutors/${id}`, {
          headers,
          cache: "no-store",
        });
        if (res.ok) {
          const json = await res.json();
          if (json.data?.name) tutorMap[id] = json.data.name;
        }
      } catch {
        // skip
      }
    });
    await Promise.all(tutorFetches);
  }

  const enrichedSessions = sessions.map((s) => ({
    ...s,
    tutorName: tutorMap[s.tutorId] || s.tutorId,
  }));

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-auto bg-background">
      <div className="p-8 space-y-8">
        <div>
          {qId && (
            <Link
              href="/questions"
              className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary transition-colors mb-4"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Questions
            </Link>
          )}
          <h1 className="text-3xl font-bold tracking-tight">
            Learning Sessions
          </h1>
          <p className="text-muted-foreground">
            {qId
              ? `Showing sessions for this question`
              : `${enrichedSessions.length} learning session${enrichedSessions.length !== 1 ? "s" : ""} found`}
          </p>
        </div>

        {error ? (
          <div className="p-4 bg-muted border border-border rounded-lg">
            <p className="text-foreground">{error}</p>
          </div>
        ) : enrichedSessions.length === 0 ? (
          <div className="p-8 text-center border-2 border-dashed rounded-lg">
            <p className="text-muted-foreground mb-2">
              No learning sessions found
            </p>
            <p className="text-sm text-muted-foreground">
              Go to the{" "}
              <Link href="/learn" className="text-primary hover:underline">
                Learn
              </Link>{" "}
              page to create one.
            </p>
          </div>
        ) : (
          <DataTable<LearningSessionRow, string>
            columns={columns}
            data={enrichedSessions}
            filterColumn="tutorName"
            rowLinkPrefix="/learn"
          />
        )}
      </div>
    </div>
  );
}
