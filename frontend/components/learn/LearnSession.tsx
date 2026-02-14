"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { LatexRenderer } from "@/components/ui/latex-renderer";
import {
  ArrowLeft,
  GraduationCap,
  Loader2,
  Pause,
  Play,
  RotateCcw,
  Search,
  Volume2,
} from "lucide-react";

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

interface QuestionDto {
  id?: string;
  questionText?: string;
  latexQuestionText?: string;
  subject?: string;
  topic?: string;
  difficulty?: string;
  options?: string[];
}

interface LearnSessionProps {
  tutors: TutorDto[];
  questions: QuestionDto[];
}

type Step = "pick-tutor" | "pick-question" | "loading" | "playing";

export function LearnSession({ tutors, questions }: LearnSessionProps) {
  const [step, setStep] = useState<Step>("pick-tutor");
  const [selectedTutor, setSelectedTutor] = useState<TutorDto | null>(null);
  const [selectedQuestion, setSelectedQuestion] = useState<QuestionDto | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [audioSrc, setAudioSrc] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  const filteredQuestions = questions.filter((q) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      q.questionText?.toLowerCase().includes(query) ||
      q.subject?.toLowerCase().includes(query) ||
      q.topic?.toLowerCase().includes(query)
    );
  });

  const handleTutorSelect = (tutor: TutorDto) => {
    setSelectedTutor(tutor);
    setStep("pick-question");
  };

  const handleQuestionSelect = async (question: QuestionDto) => {
    if (!selectedTutor) return;
    setSelectedQuestion(question);
    setStep("loading");
    setError(null);

    try {
      const response = await fetch("/api/tts/speak", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          voiceId: selectedTutor.voiceId,
          personaPrompt: selectedTutor.personaPrompt,
          questionText: question.questionText,
          latexQuestionText: question.latexQuestionText,
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Failed to generate explanation");
      }

      const data = await response.json();
      setAudioSrc(`data:audio/mp3;base64,${data.audio}`);
      setTranscript(data.transcript);
      setStep("playing");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to generate explanation",
      );
      setStep("pick-question");
    }
  };

  const togglePlayback = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleReset = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setStep("pick-tutor");
    setSelectedTutor(null);
    setSelectedQuestion(null);
    setAudioSrc(null);
    setTranscript(null);
    setIsPlaying(false);
    setError(null);
    setSearchQuery("");
  };

  const handleBack = () => {
    if (step === "pick-question") {
      setSelectedTutor(null);
      setSearchQuery("");
      setStep("pick-tutor");
    }
  };

  if (step === "loading") {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <CardTitle>
              {selectedTutor?.name} is preparing the explanation...
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Generating a personalized explanation and synthesizing voice. This
            may take a moment.
          </p>
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (step === "playing" && selectedTutor && selectedQuestion) {
    return (
      <div className="space-y-6">
        <Button variant="outline" size="sm" onClick={handleReset}>
          <RotateCcw className="mr-2 h-4 w-4" />
          Start Over
        </Button>

        <div className="grid gap-6 md:grid-cols-3">
          <div className="md:col-span-1">
            <Card>
              <CardContent className="flex flex-col items-center py-8 space-y-4">
                <div className="h-24 w-24 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center overflow-hidden border-2 border-primary/20">
                  {selectedTutor.avatarUrl ? (
                    <img
                      src={selectedTutor.avatarUrl}
                      alt={selectedTutor.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <GraduationCap className="h-12 w-12 text-primary/60" />
                  )}
                </div>
                <div className="text-center">
                  <h3 className="text-lg font-semibold">{selectedTutor.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {selectedTutor.title}
                  </p>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <Button
                    size="lg"
                    onClick={togglePlayback}
                    className="rounded-full h-14 w-14 p-0"
                  >
                    {isPlaying ? (
                      <Pause className="h-6 w-6" />
                    ) : (
                      <Play className="h-6 w-6 ml-0.5" />
                    )}
                  </Button>
                </div>

                {audioSrc && (
                  <audio
                    ref={audioRef}
                    src={audioSrc}
                    onEnded={() => setIsPlaying(false)}
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                  />
                )}
              </CardContent>
            </Card>
          </div>

          <div className="md:col-span-2 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Question
                </CardTitle>
              </CardHeader>
              <CardContent>
                <LatexRenderer
                  content={
                    selectedQuestion.latexQuestionText ||
                    selectedQuestion.questionText ||
                    ""
                  }
                />
              </CardContent>
            </Card>

            {transcript && (
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Volume2 className="h-4 w-4 text-muted-foreground" />
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Transcript
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">
                    {transcript}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (step === "pick-question") {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={handleBack}>
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
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
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
                        content={
                          q.latexQuestionText || q.questionText || ""
                        }
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
                              ? "bg-green-100 text-green-700 text-xs"
                              : q.difficulty === "MEDIUM"
                                ? "bg-yellow-100 text-yellow-700 text-xs"
                                : "bg-red-100 text-red-700 text-xs"
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

  // Step: pick-tutor
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
                No scientist tutors have been configured yet. Add tutors via
                the backend API to get started.
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
            onClick={() => handleTutorSelect(tutor)}
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
