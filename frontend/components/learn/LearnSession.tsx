"use client";

import { useState, useRef, useEffect, useCallback } from "react";
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
import { SolutionController } from "@/lib/backend";

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

interface Segment {
  stepNumber: number;
  stepTitle: string;
  solutionContent: string;
  spokenText: string;
  startTime: number;
  endTime: number;
  wordStartIdx: number;
  wordEndIdx: number;
}

interface WordTimestamps {
  words: string[];
  start: number[];
  end: number[];
}

interface LearnSessionProps {
  tutors: TutorDto[];
  questions: QuestionDto[];
}

type Step = "pick-tutor" | "pick-question" | "loading" | "playing";

export function LearnSession({ tutors, questions }: LearnSessionProps) {
  const [step, setStep] = useState<Step>("pick-tutor");
  const [selectedTutor, setSelectedTutor] = useState<TutorDto | null>(null);
  const [selectedQuestion, setSelectedQuestion] = useState<QuestionDto | null>(
    null,
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [audioSrc, setAudioSrc] = useState<string | null>(null);
  const [segments, setSegments] = useState<Segment[]>([]);
  const [wordTimestamps, setWordTimestamps] = useState<WordTimestamps | null>(
    null,
  );
  const [solution, setSolution] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeSegmentIdx, setActiveSegmentIdx] = useState(-1);
  const [activeWordIdx, setActiveWordIdx] = useState(-1);
  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const animFrameRef = useRef<number>(0);
  const segmentRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const wordRefs = useRef<Map<number, HTMLSpanElement>>(new Map());

  const filteredQuestions = questions.filter((q) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      q.questionText?.toLowerCase().includes(query) ||
      q.subject?.toLowerCase().includes(query) ||
      q.topic?.toLowerCase().includes(query)
    );
  });

  const findActiveWord = useCallback(
    (currentTime: number): number => {
      if (!wordTimestamps || wordTimestamps.start.length === 0) return -1;
      let lo = 0;
      let hi = wordTimestamps.start.length - 1;
      let result = -1;
      while (lo <= hi) {
        const mid = (lo + hi) >> 1;
        if (wordTimestamps.start[mid] <= currentTime) {
          result = mid;
          lo = mid + 1;
        } else {
          hi = mid - 1;
        }
      }
      if (
        result >= 0 &&
        result < wordTimestamps.end.length &&
        currentTime <= wordTimestamps.end[result]
      ) {
        return result;
      }
      return result >= 0 ? result : -1;
    },
    [wordTimestamps],
  );

  const findActiveSegment = useCallback(
    (wordIdx: number): number => {
      for (let i = 0; i < segments.length; i++) {
        if (wordIdx >= segments[i].wordStartIdx && wordIdx <= segments[i].wordEndIdx) {
          return i;
        }
      }
      return -1;
    },
    [segments],
  );

  const syncPlayback = useCallback(() => {
    if (!audioRef.current || !wordTimestamps) return;
    const currentTime = audioRef.current.currentTime;
    const wordIdx = findActiveWord(currentTime);
    const segIdx = findActiveSegment(wordIdx);

    setActiveWordIdx(wordIdx);
    setActiveSegmentIdx(segIdx);

    if (audioRef.current && !audioRef.current.paused) {
      animFrameRef.current = requestAnimationFrame(syncPlayback);
    }
  }, [findActiveWord, findActiveSegment, wordTimestamps]);

  useEffect(() => {
    if (isPlaying) {
      animFrameRef.current = requestAnimationFrame(syncPlayback);
    }
    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [isPlaying, syncPlayback]);

  useEffect(() => {
    if (activeSegmentIdx >= 0) {
      const el = segmentRefs.current.get(activeSegmentIdx);
      el?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [activeSegmentIdx]);

  useEffect(() => {
    if (activeWordIdx >= 0) {
      const el = wordRefs.current.get(activeWordIdx);
      el?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [activeWordIdx]);

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
      setAudioSrc(`data:audio/wav;base64,${data.audio}`);
      setSegments(data.segments || []);
      setWordTimestamps(data.wordTimestamps || null);
      setActiveSegmentIdx(-1);
      setActiveWordIdx(-1);
      setStep("playing");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to generate explanation",
      );
      setStep("pick-question");
    }
  };

  const getSolution = async () => {
    const solution = await SolutionController.solutionGetByQuestionId({
    path: {
      questionId: selectedQuestion?.id || "",
    },
    });
    if (!solution) {
      setError("Failed to fetch solution");
      setStep("pick-question");
      return;
    }
    setSolution(solution.data?.data?.solution || null);
  };

  useEffect(() => {
    if (selectedQuestion) {
      getSolution();
    }
  }, [selectedQuestion]);

  const togglePlayback = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const seekToSegment = (idx: number) => {
    if (!audioRef.current || idx < 0 || idx >= segments.length) return;
    audioRef.current.currentTime = segments[idx].startTime;
    if (!isPlaying) {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleReset = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    setStep("pick-tutor");
    setSelectedTutor(null);
    setSelectedQuestion(null);
    setAudioSrc(null);
    setSegments([]);
    setWordTimestamps(null);
    setIsPlaying(false);
    setActiveSegmentIdx(-1);
    setActiveWordIdx(-1);
    setError(null);
    setSearchQuery("");
    segmentRefs.current.clear();
    wordRefs.current.clear();
  };

  const handleBack = () => {
    if (step === "pick-question") {
      setSelectedTutor(null);
      setSearchQuery("");
      setStep("pick-tutor");
    }
  };

  // --- LOADING ---
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

  // --- PLAYING ---
  if (step === "playing" && selectedTutor && selectedQuestion) {
    return (
      <div className="space-y-4">
        {/* Top bar: tutor + controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center overflow-hidden border-2 border-primary/20 shrink-0">
              {selectedTutor.avatarUrl ? (
                <img
                  src={selectedTutor.avatarUrl}
                  alt={selectedTutor.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <GraduationCap className="h-6 w-6 text-primary/60" />
              )}
            </div>
            <div>
              <h3 className="font-semibold">{selectedTutor.name}</h3>
              <p className="text-xs text-muted-foreground">
                {selectedTutor.title}
              </p>
            </div>
            <Button
              size="sm"
              onClick={togglePlayback}
              className="rounded-full h-10 w-10 p-0 ml-2"
            >
              {isPlaying ? (
                <Pause className="h-4 w-4" />
              ) : (
                <Play className="h-4 w-4 ml-0.5" />
              )}
            </Button>
          </div>
          <Button variant="outline" size="sm" onClick={handleReset}>
            <RotateCcw className="mr-2 h-4 w-4" />
            Start Over
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

        <div className="grid gap-6 md:grid-cols-3">
          <Card className="w-full md:col-span-1">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider text-center">
                Question
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-center">
                <LatexRenderer
                  content={
                    selectedQuestion.latexQuestionText ||
                    selectedQuestion.questionText ||
                    ""
                  }
                />
              </div>
            </CardContent>
          </Card>

          <Card className="w-full md:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider text-center">
                Solution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground">
                <LatexRenderer content={solution || ""} />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Solution Steps (1fr) + Transcript (2fr) below */}
        <div
          className="grid gap-6"
          style={{
            gridTemplateColumns: "1fr 2fr",
            height: "calc(100vh - 340px)",
          }}
        >
          {/* Left: Solution Steps */}
          <div className="overflow-auto pr-2 space-y-3">
            <div className="flex items-center gap-2 mb-2 sticky top-0 bg-gray-50/90 backdrop-blur-sm py-2 z-10">
              <Volume2 className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                Solution Steps
              </h3>
            </div>
            {segments.map((seg, i) => (
              <div
                key={seg.stepNumber}
                ref={(el) => {
                  if (el) segmentRefs.current.set(i, el);
                }}
                onClick={() => seekToSegment(i)}
                className={`rounded-lg border p-4 cursor-pointer transition-all ${
                  activeSegmentIdx === i
                    ? "border-primary bg-primary/5 shadow-sm"
                    : "border-gray-200 bg-white hover:border-gray-300"
                }`}
              >
                <div className="flex items-start gap-3">
                  <span
                    className={`flex items-center justify-center h-7 w-7 rounded-full text-sm font-bold shrink-0 ${
                      activeSegmentIdx === i
                        ? "bg-primary text-primary-foreground"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {seg.stepNumber}
                  </span>
                  <div className="flex-1 min-w-0">
                    <h4
                      className={`font-medium text-sm ${
                        activeSegmentIdx === i
                          ? "text-primary"
                          : "text-gray-900"
                      }`}
                    >
                      {seg.stepTitle}
                    </h4>
                    <p className="text-sm text-gray-600 mt-1 leading-relaxed">
                      {seg.solutionContent}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Right: Transcript with word highlighting */}
          <div className="overflow-auto pl-2">
            <div className="flex items-center gap-2 mb-2 sticky top-0 bg-gray-50/90 backdrop-blur-sm py-2 z-10">
              <GraduationCap className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                Transcript
              </h3>
            </div>
            <Card>
              <CardContent className="p-5">
                {wordTimestamps && wordTimestamps.words.length > 0 ? (
                  <p className="text-sm leading-loose">
                    {wordTimestamps.words.map((word, i) => {
                      const isActive = i === activeWordIdx;
                      const isInActiveSegment =
                        activeSegmentIdx >= 0 &&
                        i >= segments[activeSegmentIdx]?.wordStartIdx &&
                        i <= segments[activeSegmentIdx]?.wordEndIdx;
                      const isPast =
                        activeWordIdx >= 0 && i < activeWordIdx;

                      return (
                        <span
                          key={i}
                          ref={(el) => {
                            if (el) wordRefs.current.set(i, el);
                          }}
                          className={`inline transition-colors duration-150 ${
                            isActive
                              ? "bg-primary/20 text-primary font-semibold rounded px-0.5"
                              : isInActiveSegment
                                ? "text-gray-900"
                                : isPast
                                  ? "text-gray-400"
                                  : "text-gray-500"
                          }`}
                        >
                          {word}{" "}
                        </span>
                      );
                    })}
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    {segments.map((s) => s.spokenText).join(" ")}
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // --- PICK QUESTION ---
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

  // --- PICK TUTOR ---
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
