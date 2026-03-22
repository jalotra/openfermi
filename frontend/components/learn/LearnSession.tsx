"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { LatexRenderer } from "@/components/ui/latex-renderer";
import { ArrowLeft, GraduationCap, Loader2, Play, Search } from "lucide-react";
import { useLearnStore } from "@/store/learn";
import type { TutorDto, QuestionDto } from "@/store/learn";

interface LearnSessionProps {
  tutors: TutorDto[];
  questions: QuestionDto[];
}

export function LearnSession({ tutors, questions }: LearnSessionProps) {
  const router = useRouter();
  const step = useLearnStore((s) => s.step);
  const selectedTutor = useLearnStore((s) => s.selectedTutor);
  const searchQuery = useLearnStore((s) => s.searchQuery);
  const error = useLearnStore((s) => s.error);
  const selectTutor = useLearnStore((s) => s.selectTutor);
  const setSearchQuery = useLearnStore((s) => s.setSearchQuery);
  const generateSession = useLearnStore((s) => s.generateSession);
  const goBack = useLearnStore((s) => s.goBack);
  const resetWizard = useLearnStore((s) => s.resetWizard);

  useEffect(() => {
    resetWizard();
  }, [resetWizard]);

  const filteredQuestions = questions.filter((q) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      q.questionText?.toLowerCase().includes(query) ||
      q.subject?.toLowerCase().includes(query) ||
      q.topic?.toLowerCase().includes(query)
    );
  });

  const handleQuestionSelect = async (question: QuestionDto) => {
    const sessionId = await generateSession(question);
    if (sessionId) {
      router.push(`/learn/${sessionId}`);
    }
  };

  if (step === "loading") {
    return (
      <Card>
        <CardContent className="py-12 space-y-4">
          <div className="flex items-center gap-3">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <h3 className="font-semibold">
              {selectedTutor?.name} is preparing the explanation...
            </h3>
          </div>
          <p className="text-sm text-muted-foreground">
            Generating a personalized step-by-step explanation and synthesizing
            voice. This may take a moment.
          </p>
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (step === "pick-question") {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={goBack}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          {selectedTutor && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Learning with</span>
              <Badge variant="secondary">{selectedTutor.name}</Badge>
            </div>
          )}
        </div>

        <h2 className="text-xl font-semibold">Choose a Question</h2>

        {error && (
          <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-lg text-sm text-destructive">
            {error}
          </div>
        )}

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by topic, subject, or text..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="grid gap-3">
          {filteredQuestions.length === 0 && (
            <p className="text-sm text-muted-foreground py-8 text-center">
              No questions found.
            </p>
          )}
          {filteredQuestions.map((q) => (
            <Card
              key={q.id}
              className="cursor-pointer transition-all hover:shadow-md hover:border-primary/30"
              onClick={() => handleQuestionSelect(q)}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm line-clamp-2">
                      <LatexRenderer
                        content={q.latexQuestionText || q.questionText || ""}
                      />
                    </div>
                    <div className="flex gap-2 mt-2">
                      {q.subject && (
                        <Badge variant="outline" className="text-xs">
                          {q.subject}
                        </Badge>
                      )}
                      {q.topic && (
                        <Badge variant="outline" className="text-xs">
                          {q.topic}
                        </Badge>
                      )}
                      {q.difficulty && (
                        <Badge
                          variant="secondary"
                          className={
                            q.difficulty === "EASY"
                              ? "bg-muted text-foreground text-xs"
                              : q.difficulty === "MEDIUM"
                                ? "bg-muted text-foreground text-xs"
                                : "bg-destructive/10 text-destructive text-xs"
                          }
                        >
                          {q.difficulty}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <Play className="h-5 w-5 text-muted-foreground shrink-0 mt-1" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Choose Your Tutor</h2>

      {tutors.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 space-y-4">
            <GraduationCap className="h-12 w-12 text-muted-foreground/50" />
            <div className="text-center space-y-2">
              <h3 className="text-lg font-semibold">No Tutors Available</h3>
              <p className="text-sm text-muted-foreground max-w-md">
                No scientist tutors have been configured yet. Add tutors via the
                backend API to get started.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {tutors.map((tutor) => (
          <Card
            key={tutor.id}
            className="cursor-pointer transition-all hover:shadow-md hover:border-primary/30"
            onClick={() => selectTutor(tutor)}
          >
            <CardContent className="flex flex-col items-center py-8 space-y-3">
              <div className="h-20 w-20 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center overflow-hidden border-2 border-primary/20">
                {tutor.avatarUrl ? (
                  <img
                    src={tutor.avatarUrl}
                    alt={tutor.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <GraduationCap className="h-10 w-10 text-primary/60" />
                )}
              </div>
              <div className="text-center">
                <h3 className="font-semibold">{tutor.name}</h3>
                <p className="text-sm text-muted-foreground">{tutor.title}</p>
              </div>
              {tutor.description && (
                <p className="text-xs text-muted-foreground text-center line-clamp-2 px-2">
                  {tutor.description}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
