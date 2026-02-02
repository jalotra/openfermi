import { AxiosError } from "axios";
import { notFound } from "next/navigation";
import { backendClient } from "@/lib/backend-client";
import { QuestionController, SessionController } from "@/lib/backend/sdk.gen";
import type { QuestionDto, SessionDto } from "@/lib/backend/types.gen";
import { SessionPlayer } from "./SessionPlayer";

export const dynamic = "force-dynamic";

export default async function SessionPage({
  params,
}: {
  params: { sessionId: string };
}) {
  const { sessionId } = params;

  let session: SessionDto | null = null;
  let error: string | null = null;

  try {
    const response = await SessionController.sessionGet({
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

  if (!session && !error) {
    notFound();
  }

  if (!session) {
    return (
      <div className="flex-1 bg-gray-50/50 p-8">
        <div className="max-w-2xl mx-auto">
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800">{error || "Session not found"}</p>
          </div>
        </div>
      </div>
    );
  }

  const questionIds = session.questionIds || [];
  const questionResults = await Promise.all(
    questionIds.map(async (id) => {
      try {
        const response = await QuestionController.questionGet({
          client: backendClient,
          path: { id },
        });
        return response.data?.data || null;
      } catch {
        return null;
      }
    }),
  );

  const questions = questionResults.filter((q): q is QuestionDto => Boolean(q));

  return <SessionPlayer session={session} questions={questions} />;
}
