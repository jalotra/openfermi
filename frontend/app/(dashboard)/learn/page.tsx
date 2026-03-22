import { backendClient } from "@/lib/backend-client";
import { QuestionController } from "@/lib/backend/sdk.gen";
import type { QuestionDto } from "@/lib/backend/types.gen";
import { LearnSession } from "@/components/learn/LearnSession";

export const dynamic = "force-dynamic";

interface TutorDto {
  id: string;
  name: string;
  title: string;
  description: string;
  avatarUrl: string;
  voiceId: string;
  personaPrompt: string;
  active: boolean;
}

const BACKEND_URL = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"
).replace(/\/+$/, "");

async function fetchActiveTutors(): Promise<TutorDto[]> {
  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json",
    };
    if (process.env.NEXT_PUBLIC_API_KEY) {
      headers["X-API-KEY"] = process.env.NEXT_PUBLIC_API_KEY;
    }

    const response = await fetch(`${BACKEND_URL}/tutors/active`, {
      headers,
      cache: "no-store",
    });

    if (!response.ok) return [];

    const data = await response.json();
    return data.data || [];
  } catch {
    return [];
  }
}

export default async function LearnPage() {
  const [tutors, questionsResponse] = await Promise.all([
    fetchActiveTutors(),
    QuestionController.questionRead({ client: backendClient }),
  ]);

  const questions: QuestionDto[] = questionsResponse.data?.data || [];

  return (
    <div className="flex-1 min-h-0 overflow-auto bg-muted/50 p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Learn from a Scientist
          </h1>
          <p className="text-muted-foreground mt-1">
            Pick a tutor and a question, then listen to a personalized
            explanation in their voice.
          </p>
        </div>

        <LearnSession tutors={tutors} questions={questions} />
      </div>
    </div>
  );
}
