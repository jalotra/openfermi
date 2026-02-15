"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { LatexRenderer } from "@/components/ui/latex-renderer";
import { GraduationCap, Pause, Play, RotateCcw, Volume2 } from "lucide-react";
import Link from "next/link";
import { useLearnStore } from "@/store/learn";
import { SolutionController } from "@/lib/backend";
import { backendClient } from "@/lib/backend-client";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

function scrollInContainer(el: HTMLElement, container: HTMLElement) {
  const elRect = el.getBoundingClientRect();
  const containerRect = container.getBoundingClientRect();
  if (elRect.bottom > containerRect.bottom || elRect.top < containerRect.top) {
    container.scrollTo({
      top:
        container.scrollTop +
        (elRect.top - containerRect.top) -
        containerRect.height / 2,
      behavior: "smooth",
    });
  }
}

export function LearnPlayer() {
  const isMobile = useIsMobile();
  const tutor = useLearnStore((s) => s.tutor);
  const question = useLearnStore((s) => s.question);
  const audioUrl = useLearnStore((s) => s.audioUrl);
  const segments = useLearnStore((s) => s.segments);
  const wordTimestamps = useLearnStore((s) => s.wordTimestamps);
  const isPlaying = useLearnStore((s) => s.isPlaying);
  const activeSegmentIdx = useLearnStore((s) => s.activeSegmentIdx);
  const activeWordIdx = useLearnStore((s) => s.activeWordIdx);
  const setPlaying = useLearnStore((s) => s.setPlaying);
  const seekToSegment = useLearnStore((s) => s.seekToSegment);
  const syncTick = useLearnStore((s) => s.syncTick);

  const [solution, setSolution] = useState<string | null>(null);
  const [solutionLoading, setSolutionLoading] = useState(false);

  const audioRef = useRef<HTMLAudioElement>(null);
  const animFrameRef = useRef<number>(0);
  const segmentRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const wordRefs = useRef<Map<number, HTMLSpanElement>>(new Map());
  const stepsContainerRef = useRef<HTMLDivElement>(null);
  const transcriptContainerRef = useRef<HTMLDivElement>(null);
  const userInteractingRef = useRef(false);

  const tick = useCallback(() => {
    if (!audioRef.current) return;
    syncTick(audioRef.current.currentTime);
    if (!audioRef.current.paused) {
      animFrameRef.current = requestAnimationFrame(tick);
    }
  }, [syncTick]);

  useEffect(() => {
    if (isPlaying) {
      animFrameRef.current = requestAnimationFrame(tick);
    }
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isPlaying, tick]);

  useEffect(() => {
    if (userInteractingRef.current) return;
    const el = segmentRefs.current.get(activeSegmentIdx);
    if (activeSegmentIdx >= 0 && el && stepsContainerRef.current) {
      scrollInContainer(el, stepsContainerRef.current);
    }
  }, [activeSegmentIdx]);

  useEffect(() => {
    if (userInteractingRef.current) return;
    const el = wordRefs.current.get(activeWordIdx);
    if (activeWordIdx >= 0 && el && transcriptContainerRef.current) {
      scrollInContainer(el, transcriptContainerRef.current);
    }
  }, [activeWordIdx]);

  useEffect(() => {
    const questionId = question?.id;
    setSolution(null);

    if (!questionId) {
      setSolutionLoading(false);
      return;
    }

    let cancelled = false;
    setSolutionLoading(true);

    (async () => {
      try {
        const response = await SolutionController.solutionGetByQuestionId({
          client: backendClient,
          path: { questionId },
        });
        if (cancelled) return;
        setSolution(response.data?.data?.solution ?? null);
      } catch {
        if (cancelled) return;
        setSolution(null);
      } finally {
        if (!cancelled) setSolutionLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [question?.id]);

  const togglePlayback = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setPlaying(!isPlaying);
  };

  const handleSeekToSegment = (idx: number) => {
    if (!audioRef.current || idx < 0 || idx >= segments.length) return;
    audioRef.current.currentTime = segments[idx].startTime;
    seekToSegment(idx);
    if (!isPlaying) {
      audioRef.current.play();
      setPlaying(true);
    }
  };

  if (!tutor || !question) return null;

  return (
    <div className="space-y-4">
      <div
        className={cn(
          "flex items-center justify-between",
          isMobile && "flex-col items-start gap-3",
        )}
      >
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center overflow-hidden border-2 border-primary/20 shrink-0">
            {tutor.avatarUrl ? (
              <img
                src={tutor.avatarUrl}
                alt={tutor.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <GraduationCap className="h-6 w-6 text-primary/60" />
            )}
          </div>
          <div>
            <h3 className="font-semibold">{tutor.name}</h3>
            <p className="text-xs text-muted-foreground">{tutor.title}</p>
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
        <Link href="/learn">
          <Button variant="outline" size="sm">
            <RotateCcw className="mr-2 h-4 w-4" />
            New Session
          </Button>
        </Link>
      </div>

      {audioUrl && (
        <audio
          ref={audioRef}
          src={audioUrl}
          onEnded={() => setPlaying(false)}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
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
                  question.latexQuestionText || question.questionText || ""
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
            {solutionLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            ) : solution ? (
              <div className="text-sm">
                <LatexRenderer content={solution} />
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">
                No solution available for this question yet.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div
        className="grid gap-6"
        style={{
          gridTemplateColumns: isMobile ? "1fr" : "1fr 2fr",
          ...(isMobile ? {} : { height: "calc(100vh - 340px)" }),
        }}
      >
        <div
          ref={stepsContainerRef}
          onMouseEnter={() => (userInteractingRef.current = true)}
          onMouseLeave={() => (userInteractingRef.current = false)}
          className={cn(
            "overflow-auto pr-2 space-y-3",
            isMobile && "max-h-[50vh]",
          )}
        >
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
              onClick={() => handleSeekToSegment(i)}
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
                      activeSegmentIdx === i ? "text-primary" : "text-gray-900"
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

        <div
          ref={transcriptContainerRef}
          onMouseEnter={() => (userInteractingRef.current = true)}
          onMouseLeave={() => (userInteractingRef.current = false)}
          className={cn("overflow-auto", isMobile ? "max-h-[50vh]" : "pl-2")}
        >
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
                    const isPast = activeWordIdx >= 0 && i < activeWordIdx;

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
