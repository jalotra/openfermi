import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { backendClient } from "@/lib/backend-client";
import { QuestionDto } from "@/lib/backend/types.gen";
import { QuestionController } from "@/lib/backend/sdk.gen";
import { AxiosError } from "axios";
import { notFound } from "next/navigation";
import { SolutionViewer } from "@/components/solution-viewer";

export const dynamic = "force-dynamic";

interface HintStep {
  stepNumber: number;
  title: string;
  content: string;
}

const BACKEND_URL = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"
).replace(/\/+$/, "");

async function fetchSolutionByQuestionId(questionId: string): Promise<{
  hints: HintStep[] | null;
  solution: string | null;
} | null> {
  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json",
    };
    if (process.env.NEXT_PUBLIC_API_KEY) {
      headers["X-API-KEY"] = process.env.NEXT_PUBLIC_API_KEY;
    }

    const response = await fetch(
      `${BACKEND_URL}/solutions/question/${questionId}`,
      { headers, cache: "no-store" },
    );

    if (!response.ok) return null;

    const data = await response.json();
    const solutionData = data.data;
    if (!solutionData) return null;

    let parsedHints: HintStep[] | null = null;
    if (solutionData.hints) {
      try {
        parsedHints = JSON.parse(solutionData.hints);
      } catch {
        parsedHints = null;
      }
    }

    return {
      hints: parsedHints,
      solution: solutionData.solution || null,
    };
  } catch {
    return null;
  }
}

export default async function SolutionPage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = await params;

  let question: QuestionDto | null = null;

  try {
    const response = await QuestionController.questionGet({
      client: backendClient,
      path: { id },
    });
    question = response.data?.data || null;
  } catch (err) {
    if (err instanceof AxiosError) {
      notFound();
    }
    throw err;
  }

  if (!question) notFound();

  const existingSolution = await fetchSolutionByQuestionId(id);

  return (
    <div className="flex-1 min-h-0 overflow-auto bg-gray-50/50 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <Link
          href={`/questions/${id}`}
          className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Question
        </Link>

        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Solution</h1>
          <div className="flex items-center gap-2">
            {question.topic && (
              <Badge variant="outline">{question.topic}</Badge>
            )}
            {question.subject && (
              <Badge variant="secondary">{question.subject}</Badge>
            )}
            {question.difficulty && (
              <Badge
                variant="secondary"
                className={
                  question.difficulty === "EASY"
                    ? "bg-green-100 text-green-700"
                    : question.difficulty === "MEDIUM"
                      ? "bg-yellow-100 text-yellow-700"
                      : "bg-red-100 text-red-700"
                }
              >
                {question.difficulty}
              </Badge>
            )}
          </div>
        </div>

        <SolutionViewer
          questionId={id}
          questionText={question.questionText || ""}
          latexQuestionText={question.latexQuestionText || ""}
          imageUrls={question.imageUrls || []}
          initialHints={existingSolution?.hints || null}
          initialSolution={existingSolution?.solution || null}
        />
      </div>
    </div>
  );
}
