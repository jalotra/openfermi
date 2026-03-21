"use client";

import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Pause,
  Play,
  Square,
  Menu,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";

interface HeaderBarProps {
  currentQuestion: number;
  totalQuestions: number;
  onPreviousQuestion: () => void;
  onNextQuestion: () => void;
  onSidebarToggle?: () => void;
  timeLeftSeconds?: number;
  isPaused?: boolean;
  onPause?: () => void;
  onResume?: () => void;
  onEnd?: () => void;
}

function formatCountdown(seconds: number) {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${String(hrs).padStart(2, "0")}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

export function HeaderBar({
  currentQuestion,
  totalQuestions,
  onPreviousQuestion,
  onNextQuestion,
  onSidebarToggle,
  timeLeftSeconds = 0,
  isPaused = false,
  onPause,
  onResume,
  onEnd,
}: HeaderBarProps) {
  const router = useRouter();
  const isLowTime = timeLeftSeconds < 60;

  return (
    <header className="w-full bg-background border-b border-border px-6 py-4 flex items-center justify-between">
      {/* Left section */}
      <div className="flex items-center gap-4">
        {onSidebarToggle && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onSidebarToggle}
            className="h-9 w-9"
          >
            <Menu className="h-5 w-5" />
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
          className="h-9 w-9"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>

        <div
          className={`text-lg font-mono font-medium tabular-nums ${isLowTime ? "text-destructive animate-pulse" : "text-foreground"}`}
        >
          {formatCountdown(timeLeftSeconds)}
        </div>

        {isPaused && (
          <Badge variant="secondary" className="bg-muted text-foreground">
            PAUSED
          </Badge>
        )}
      </div>

      {/* Center section - Question navigation */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={onPreviousQuestion}
          disabled={currentQuestion === 1}
          className="h-9 w-9"
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <div className="text-sm font-medium text-muted-foreground">
          Q {currentQuestion}/{totalQuestions}
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onNextQuestion}
          disabled={currentQuestion === totalQuestions}
          className="h-9 w-9"
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>

      {/* Right section - Lifecycle controls */}
      <div className="flex items-center gap-2">
        {isPaused ? (
          <Button
            variant="outline"
            size="sm"
            onClick={onResume}
            className="gap-1.5"
          >
            <Play className="h-4 w-4" />
            Resume
          </Button>
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={onPause}
            className="gap-1.5"
          >
            <Pause className="h-4 w-4" />
            Pause
          </Button>
        )}
        <Button
          variant="destructive"
          size="sm"
          onClick={onEnd}
          className="gap-1.5"
        >
          <Square className="h-3.5 w-3.5" />
          End Session
        </Button>
      </div>
    </header>
  );
}
