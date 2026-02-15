"use client";

import { useEffect, useRef } from "react";
import { LearnPlayer } from "@/components/learn/LearnPlayer";
import { useLearnStore } from "@/store/learn";
import type {
  TutorSummary,
  QuestionDto,
  Segment,
  WordTimestamps,
} from "@/store/learn";

interface LearnPlayerLoaderProps {
  tutor: TutorSummary;
  question: QuestionDto;
  audioUrl: string;
  segments: Segment[];
  wordTimestamps: WordTimestamps | null;
  sessionId: string;
}

export function LearnPlayerLoader({
  tutor,
  question,
  audioUrl,
  segments,
  wordTimestamps,
  sessionId,
}: LearnPlayerLoaderProps) {
  const loadSession = useLearnStore((s) => s.loadSession);
  const hydrated = useRef(false);

  useEffect(() => {
    if (hydrated.current) return;
    hydrated.current = true;

    let timestamps = wordTimestamps;

    if (!timestamps) {
      const storeTimestamps = useLearnStore.getState().wordTimestamps;
      if (storeTimestamps && storeTimestamps.words.length > 0) {
        timestamps = storeTimestamps;
      }
    }

    if (!timestamps) {
      try {
        const stored = sessionStorage.getItem(
          `learn-timestamps-${sessionId}`,
        );
        if (stored) {
          timestamps = JSON.parse(stored);
          sessionStorage.removeItem(`learn-timestamps-${sessionId}`);
        }
      } catch {
        // sessionStorage not available or parse error
      }
    }

    loadSession({
      tutor,
      question,
      audioUrl,
      segments,
      wordTimestamps: timestamps,
    });
  }, [tutor, question, audioUrl, segments, wordTimestamps, sessionId, loadSession]);

  return <LearnPlayer />;
}
