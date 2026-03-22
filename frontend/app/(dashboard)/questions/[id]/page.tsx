import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { LatexRenderer } from "@/components/ui/latex-renderer";
import {
  Play,
  ArrowLeft,
  ImageIcon,
  ChevronDown,
  GraduationCap,
  Lightbulb,
} from "lucide-react";
import Link from "next/link";
import { backendClient } from "@/lib/backend-client";
import { QuestionDto } from "@/lib/backend/types.gen";
import { QuestionController } from "@/lib/backend/sdk.gen";
import { AxiosError } from "axios";
import { notFound } from "next/navigation";
import { parseDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function QuestionDetailsPage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = await params;
  if (process.env.NODE_ENV === "development") {
    console.log("id", id);
  }

  let question: QuestionDto | null = null;

  try {
    const response = await QuestionController.questionGet({
      client: backendClient,
      path: { id },
    });
    question = response.data?.data || null;
  } catch (err) {
    if (err instanceof AxiosError) {
      console.error(
        err.response?.data?.message ||
          err.message ||
          "Failed to fetch question",
      );
      notFound();
    }
    throw err;
  }

  if (process.env.NODE_ENV === "development") {
    console.log("question", question);
  }

  if (!question) notFound();

  return (
    <div className="flex-1 min-h-0 overflow-auto bg-muted/50 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <Link
          href="/questions"
          className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Questions
        </Link>

        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight">
              {question.topic}
            </h1>
            <div className="flex items-center gap-2">
              <Badge
                variant="secondary"
                className={
                  question.difficulty === "EASY"
                    ? "bg-muted text-foreground"
                    : question.difficulty === "MEDIUM"
                      ? "bg-muted text-foreground"
                      : "bg-destructive/10 text-destructive"
                }
              >
                {question.difficulty}
              </Badge>
              <span className="text-sm text-muted-foreground">
                Question Number: {question.questionNumber}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link href={`/learning-sessions?questionId=${question.id || id}`}>
              <Button size="lg" variant="outline">
                <GraduationCap className="mr-2 h-4 w-4" />
                Learning Sessions
              </Button>
            </Link>
            <Link href={`/questions/${question.id || id}/solution`}>
              <Button size="lg" variant="outline">
                <Lightbulb className="mr-2 h-4 w-4" />
                View Solution
              </Button>
            </Link>
            <Link href={`/sessions/new?questionIds=${question.id || id}`}>
              <Button size="lg" className="shadow-lg shadow-primary/20">
                <Play className="mr-2 h-4 w-4 fill-current" />
                Start Session
              </Button>
            </Link>
          </div>
        </div>

        <Separator />

        <div className="grid gap-6 md:grid-cols-3">
          <div className="md:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Question Content</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-lg leading-relaxed text-foreground">
                  <LatexRenderer content={question.latexQuestionText || ""} />
                </div>
              </CardContent>
            </Card>

            {question.imageUrls && question.imageUrls.length > 0 && (
              <Card>
                <CardHeader>
                  <details className="group">
                    <summary className="flex items-center gap-2 cursor-pointer list-none">
                      <ImageIcon className="h-5 w-5 text-muted-foreground" />
                      <CardTitle className="inline">
                        Question Image{question.imageUrls.length > 1 ? "s" : ""}
                      </CardTitle>
                      <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform group-open:rotate-180 ml-auto" />
                    </summary>
                    <CardContent className="pt-4 px-0 space-y-4">
                      {question.imageUrls.map((url, i) => (
                        <img
                          key={i}
                          src={url}
                          alt={`Question image ${i + 1}`}
                          className="max-w-full rounded-lg border"
                        />
                      ))}
                    </CardContent>
                  </details>
                </CardHeader>
              </Card>
            )}
            {question.options &&
              question.options.length > 0 &&
              question.options.every((option) => option.length > 0) && (
                <Card>
                  <CardHeader>
                    <CardTitle>Options</CardTitle>
                  </CardHeader>
                  <CardContent className="grid gap-4">
                    {(question.options || []).map((option, index) => {
                      const key = String.fromCharCode(65 + index); // A, B, C, D
                      return (
                        <div
                          key={index}
                          className="flex items-center p-4 rounded-lg border border-border bg-background shadow-sm"
                        >
                          <span className="flex items-center justify-center h-8 w-8 rounded-full bg-primary/10 text-primary font-bold mr-4 shrink-0">
                            {key}
                          </span>
                          <div className="text-muted-foreground flex-1">
                            <LatexRenderer content={option} />
                          </div>
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>
              )}
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Metadata</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {question.subject && (
                  <div>
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      Subject
                    </label>
                    <p className="font-medium">{question.subject}</p>
                  </div>
                )}
                {question.topic && (
                  <div>
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      Topic
                    </label>
                    <p className="font-medium">{question.topic}</p>
                  </div>
                )}
                {question.examType && (
                  <div>
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      Exam Type
                    </label>
                    <p className="font-medium">{question.examType}</p>
                  </div>
                )}
                {question.year && (
                  <div>
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      Year
                    </label>
                    <p className="font-medium">{question.year}</p>
                  </div>
                )}
                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Created
                  </label>
                  <p className="font-medium">
                    {parseDate(question.createdAt)?.toLocaleDateString() ??
                      "Unknown"}
                  </p>
                </div>
                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Last Modified
                  </label>
                  <p className="font-medium">
                    {parseDate(question.updatedAt)?.toLocaleDateString() ??
                      "Unknown"}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
