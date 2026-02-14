import { AxiosError } from "axios";
import { notFound } from "next/navigation";
import { backendClient } from "@/lib/backend-client";
import { QuestionController, SessionController } from "@/lib/backend/sdk.gen";
import type { QuestionDto, SessionDto } from "@/lib/backend/types.gen";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { LatexRenderer } from "@/components/ui/latex-renderer";
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  MinusCircle,
  Clock,
  Target,
  BarChart3,
} from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function SessionResultsPage({
  params,
}: {
  params: { sessionId: string };
}) {
  const { sessionId } = params;

  let session: SessionDto | null = null;

  try {
    const response = await SessionController.get({
      client: backendClient,
      path: { id: sessionId },
    });
    session = response.data?.data || null;
  } catch (err) {
    if (err instanceof AxiosError) {
      console.error(err.response?.data?.message || err.message);
    }
    notFound();
  }

  if (!session) notFound();

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
  const answers = session.answers || {};
  const totalQuestions = session.totalQuestions || questions.length;
  const correctCount = session.correctAnswers || 0;
  const incorrectCount = session.incorrectAnswers || 0;
  const unansweredCount = session.unanswered || 0;
  const score = session.score || 0;
  const timeSpent = session.timeSpentSeconds || 0;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins === 0) return `${secs}s`;
    return `${mins}m ${secs}s`;
  };

  const scoreColor =
    score >= 70
      ? "text-green-600"
      : score >= 40
        ? "text-yellow-600"
        : "text-red-600";

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-auto bg-white">
      <div className="p-8 space-y-8 max-w-4xl mx-auto w-full">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Session Results
            </h1>
            <p className="text-muted-foreground mt-1">
              {session.state === "ENDED"
                ? "Here's how you did"
                : "Session in progress"}
            </p>
          </div>
          <div className="flex gap-2">
            <Link href={`/sessions/${sessionId}`}>
              <Button variant="outline">Review Session</Button>
            </Link>
            <Link href="/questions">
              <Button>New Session</Button>
            </Link>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Target className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Score</p>
                  <p className={`text-2xl font-bold ${scoreColor}`}>
                    {score.toFixed(1)}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Correct</p>
                  <p className="text-2xl font-bold text-green-600">
                    {correctCount}/{totalQuestions}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <XCircle className="h-8 w-8 text-red-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Incorrect</p>
                  <p className="text-2xl font-bold text-red-600">
                    {incorrectCount}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Clock className="h-8 w-8 text-blue-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Time Spent</p>
                  <p className="text-2xl font-bold">{formatTime(timeSpent)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {unansweredCount > 0 && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MinusCircle className="h-4 w-4" />
            <span>{unansweredCount} question(s) left unanswered</span>
          </div>
        )}

        <Separator />

        <div>
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Question Breakdown
          </h2>
          <div className="space-y-4">
            {questions.map((q, i) => {
              const userAnswer = answers[q.id || ""];
              const correctAnswer = q.correctAnswer;
              const isCorrect = userAnswer === correctAnswer;
              const isUnanswered = !userAnswer;

              const optionLabels = ["A", "B", "C", "D"];

              return (
                <Card key={q.id}>
                  <CardContent className="p-5">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 mt-1">
                        {isUnanswered ? (
                          <MinusCircle className="h-5 w-5 text-gray-400" />
                        ) : isCorrect ? (
                          <CheckCircle2 className="h-5 w-5 text-green-600" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-600" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-sm font-medium text-muted-foreground">
                            Q{i + 1}
                          </span>
                          <Badge
                            variant="secondary"
                            className={
                              isUnanswered
                                ? "bg-gray-100 text-gray-600"
                                : isCorrect
                                  ? "bg-green-100 text-green-700"
                                  : "bg-red-100 text-red-700"
                            }
                          >
                            {isUnanswered
                              ? "Skipped"
                              : isCorrect
                                ? "Correct"
                                : "Incorrect"}
                          </Badge>
                          {q.subject && (
                            <Badge variant="outline" className="text-xs">
                              {q.subject}
                            </Badge>
                          )}
                        </div>
                        <div className="text-sm text-gray-800 mb-3">
                          <LatexRenderer
                            content={
                              q.latexQuestionText || q.questionText || ""
                            }
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          {(q.options || []).map((option, oi) => {
                            const label = optionLabels[oi];
                            const isUserChoice = userAnswer === label;
                            const isCorrectOption = correctAnswer === label;

                            let className =
                              "p-2 rounded border text-sm flex items-start gap-2";
                            if (isCorrectOption) {
                              className +=
                                " bg-green-50 border-green-300 text-green-800";
                            } else if (isUserChoice && !isCorrect) {
                              className +=
                                " bg-red-50 border-red-300 text-red-800";
                            } else {
                              className += " bg-gray-50 border-gray-200";
                            }

                            return (
                              <div key={oi} className={className}>
                                <span className="font-medium flex-shrink-0">
                                  {label}.
                                </span>
                                <LatexRenderer content={option} />
                              </div>
                            );
                          })}
                        </div>
                        {!isCorrect && !isUnanswered && (
                          <p className="text-xs text-muted-foreground mt-2">
                            Your answer: {userAnswer} · Correct answer:{" "}
                            {correctAnswer}
                          </p>
                        )}
                        {q.explanation && (
                          <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded text-sm">
                            <p className="font-medium text-blue-800 mb-1">
                              Explanation
                            </p>
                            <LatexRenderer content={q.explanation} />
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        <div className="flex justify-center gap-4 pt-4">
          <Link href="/sessions">
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Sessions
            </Button>
          </Link>
          <Link href="/questions">
            <Button>Start New Session</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
