"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { LatexRenderer } from "@/components/ui/latex-renderer";
import { Skeleton } from "@/components/ui/skeleton";
import { Lightbulb, BookOpen, Sparkles, Loader2 } from "lucide-react";

interface HintStep {
  stepNumber: number;
  title: string;
  content: string;
}

interface SolutionViewerProps {
  questionId: string;
  questionText: string;
  latexQuestionText: string;
  imageUrls: string[];
  initialHints: HintStep[] | null;
  initialSolution: string | null;
}

export function SolutionViewer({
  questionId,
  questionText,
  latexQuestionText,
  imageUrls,
  initialHints,
  initialSolution,
}: SolutionViewerProps) {
  const [hints, setHints] = useState<HintStep[] | null>(initialHints);
  const [solution, setSolution] = useState<string | null>(initialSolution);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateSolution = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/solutions/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionId,
          questionText,
          latexQuestionText,
          imageUrls,
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Failed to generate solution");
      }

      const data = await response.json();
      const solutionData = data.data || data;

      const parsedHints: HintStep[] = solutionData.hints
        ? JSON.parse(solutionData.hints)
        : [];
      setHints(parsedHints);
      setSolution(solutionData.solution || null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to generate solution",
      );
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <CardTitle>Generating Solution...</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              The AI is working through the problem. This may take a moment.
            </p>
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!hints && !solution) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12 space-y-4">
          <Sparkles className="h-12 w-12 text-muted-foreground/50" />
          <div className="text-center space-y-2">
            <h3 className="text-lg font-semibold">No Solution Yet</h3>
            <p className="text-sm text-muted-foreground max-w-md">
              Click the button below to generate a step-by-step solution with
              hints for this question using AI.
            </p>
          </div>
          {error && (
            <p className="text-sm text-red-600 bg-red-50 px-4 py-2 rounded-md">
              {error}
            </p>
          )}
          <Button onClick={generateSolution} size="lg" className="mt-2">
            <Sparkles className="mr-2 h-4 w-4" />
            Generate Solution
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {hints && hints.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-yellow-500" />
              <CardTitle>Hints</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              {hints.map((hint) => (
                <AccordionItem
                  key={hint.stepNumber}
                  value={`hint-${hint.stepNumber}`}
                >
                  <AccordionTrigger className="text-left hover:no-underline">
                    <span className="flex items-center gap-3">
                      <span className="flex items-center justify-center h-7 w-7 rounded-full bg-yellow-100 text-yellow-700 text-sm font-bold shrink-0">
                        {hint.stepNumber}
                      </span>
                      <span className="font-medium py-1">
                        <LatexRenderer content={hint.title} />
                      </span>
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="text-sm h-auto">
                    <div className="pl-10 pt-2">
                      <LatexRenderer content={hint.content} />
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>
      )}

      {solution && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-green-600" />
              <CardTitle>Solution</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none">
              <LatexRenderer content={solution} />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
