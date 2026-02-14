import { notFound } from "next/navigation";
import { backendClient } from "@/lib/backend-client";
import { QuestionController } from "@/lib/backend/sdk.gen";
import { LearnPlayerLoader } from "./LearnPlayerLoader";

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

interface LearningSessionData {
  id: string;
  questionId: string;
  tutorId: string;
  audioUrl: string;
  transcript: string;
  segments: string;
}

interface TutorData {
  id: string;
  name: string;
  title: string;
  avatarUrl: string;
}

export default async function LearnSessionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const headers = getBackendHeaders();

  const sessionRes = await fetch(`${BACKEND_URL}/learning-sessions/${id}`, {
    headers,
    cache: "no-store",
  });

  if (!sessionRes.ok) notFound();

  const sessionJson = await sessionRes.json();
  const session: LearningSessionData | null = sessionJson.data || null;
  if (!session || !session.audioUrl) notFound();

  const [questionRes, tutorRes] = await Promise.all([
    QuestionController.questionGet({
      client: backendClient,
      path: { id: session.questionId },
    }).catch(() => null),
    fetch(`${BACKEND_URL}/tutors/${session.tutorId}`, {
      headers,
      cache: "no-store",
    }).catch(() => null),
  ]);

  const question = questionRes?.data?.data || null;
  if (!question) notFound();

  let tutor: TutorData | null = null;
  if (tutorRes && tutorRes.ok) {
    const tutorJson = await tutorRes.json();
    tutor = tutorJson.data || null;
  }
  if (!tutor) notFound();

  let segments = [];
  try {
    segments = JSON.parse(session.segments || "[]");
  } catch {
    segments = [];
  }

  return (
    <div className="flex-1 min-h-0 overflow-auto bg-gray-50/50 p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Learn from a Scientist
          </h1>
          <p className="text-muted-foreground mt-1">
            Listening to {tutor.name} explain this question.
          </p>
        </div>

        <LearnPlayerLoader
          tutor={tutor}
          question={{
            id: question.id,
            questionText: question.questionText,
            latexQuestionText: question.latexQuestionText,
          }}
          audioUrl={session.audioUrl}
          segments={segments}
          sessionId={id}
        />
      </div>
    </div>
  );
}
