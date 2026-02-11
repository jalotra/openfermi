"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { HeaderBar } from "@/components/canvas/HeaderBar";
import { QuestionPanel } from "@/components/canvas/QuestionPanel";
import { CanvasEditor, CanvasTool } from "@/components/canvas/CanvasEditor";
import { DrawingToolbar } from "@/components/canvas/DrawingToolbar";
import { CollaborationBar } from "@/components/canvas/CollaborationBar";
import { useSidebar } from "@/components/canvas/SidebarContext";
import { SessionDto, QuestionDto } from "@/lib/backend/types.gen";
import { backendClient } from "@/lib/backend-client";
import { SessionController } from "@/lib/backend/sdk.gen";
import { AxiosError } from "axios";
import { Button } from "@/components/ui/button";
import { Play } from "lucide-react";
import { exportAs } from "tldraw";

interface SessionPlayerProps {
  session: SessionDto;
  questions: QuestionDto[];
}

export function SessionPlayer({ session, questions }: SessionPlayerProps) {
  const router = useRouter();
  const { toggle } = useSidebar();
  const editorRef = useRef<any>(null);

  const [sessionState, setSessionState] = useState(session.state || "DRAFT");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>(
    session.answers || {},
  );
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">(
    "idle",
  );
  const [timeLeft, setTimeLeft] = useState(session.timeLeftSeconds ?? 0);
  const [transitioning, setTransitioning] = useState(false);

  const currentQuestion = questions[currentIndex];
  const totalQuestions = questions.length;

  const triggerTransition = async (event: string) => {
    if (!session.id || transitioning) return;
    setTransitioning(true);
    try {
      const response = await SessionController.transition({
        client: backendClient,
        path: { id: session.id },
        query: { event },
      });
      const updated = response.data?.data;
      if (updated?.state) {
        setSessionState(updated.state);
        if (updated.timeLeftSeconds != null) {
          setTimeLeft(updated.timeLeftSeconds);
        }
      }
    } catch (err) {
      const msg =
        err instanceof AxiosError
          ? err.response?.data?.message || err.message
          : "Transition failed";
      console.error(msg);
    } finally {
      setTransitioning(false);
    }
  };

  // Countdown timer -- only ticks when LIVE
  useEffect(() => {
    if (sessionState !== "LIVE") return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          triggerTransition("END");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [sessionState]);

  // Periodically persist timeLeftSeconds (every 10s while LIVE)
  useEffect(() => {
    if (sessionState !== "LIVE" || !session.id) return;

    const interval = setInterval(async () => {
      try {
        await SessionController.upsert({
          client: backendClient,
          body: { id: session.id, answers, timeLeftSeconds: timeLeft },
        });
      } catch {
        // best-effort
      }
    }, 10_000);

    return () => clearInterval(interval);
  }, [sessionState, timeLeft, answers, session.id]);

  // Auto-save answers with debounce (2 seconds)
  useEffect(() => {
    if (saveStatus !== "saving" || !session.id) return;

    const timer = setTimeout(async () => {
      try {
        await SessionController.upsert({
          client: backendClient,
          body: { id: session.id, answers, timeLeftSeconds: timeLeft },
        });
        setSaveStatus("saved");
        setTimeout(() => setSaveStatus("idle"), 1000);
      } catch (err) {
        const msg =
          err instanceof AxiosError
            ? err.response?.data?.message || err.message
            : "Failed to save answers";
        console.error(msg);
        setSaveStatus("idle");
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [answers, saveStatus]);

  const handleAnswerChange = useCallback(
    (questionId: string, answer: string) => {
      setAnswers((prev) => ({ ...prev, [questionId]: answer }));
      setSaveStatus("saving");
    },
    [],
  );

  const handlePreviousQuestion = () => {
    if (currentIndex > 0) setCurrentIndex((prev) => prev - 1);
  };

  const handleNextQuestion = () => {
    if (currentIndex < totalQuestions - 1) setCurrentIndex((prev) => prev + 1);
  };

  const handleStart = () => triggerTransition("START");
  const handlePause = () => triggerTransition("PAUSE");
  const handleResume = () => triggerTransition("RESUME");

  const handleEnd = async () => {
    if (!session.id) return;

    // Save final answers before ending
    let correct = 0;
    let incorrect = 0;
    let unanswered = 0;

    questions.forEach((q) => {
      const userAnswer = answers[q.id || ""];
      if (!userAnswer) {
        unanswered++;
      } else if (userAnswer === q.correctAnswer) {
        correct++;
      } else {
        incorrect++;
      }
    });

    const score = totalQuestions > 0 ? (correct / totalQuestions) * 100 : 0;

    try {
      await SessionController.upsert({
        client: backendClient,
        body: {
          id: session.id,
          answers,
          score,
          correctAnswers: correct,
          incorrectAnswers: incorrect,
          unanswered,
          timeLeftSeconds: timeLeft,
        },
      });
    } catch (err) {
      if (err instanceof AxiosError) {
        console.error(
          err.response?.data?.message ||
            err.message ||
            "Failed to complete session",
        );
      } else {
        console.error("Failed to complete session:", err);
      }
    }

    await triggerTransition("END");
    router.push("/sessions");
  };

  // Redirect if already ended
  useEffect(() => {
    if (sessionState === "ENDED") {
      router.push("/sessions");
    }
  }, [sessionState, router]);

  const questionPanelData = currentQuestion
    ? {
        question: currentQuestion.questionText || "",
        latexQuestion: currentQuestion.latexQuestionText || currentQuestion.questionText || "",
        options: {
          A: currentQuestion.options?.[0] || "",
          B: currentQuestion.options?.[1] || "",
          C: currentQuestion.options?.[2] || "",
          D: currentQuestion.options?.[3] || "",
        },
        latexOptions: {
          A: currentQuestion.options?.[0],
          B: currentQuestion.options?.[1],
          C: currentQuestion.options?.[2],
          D: currentQuestion.options?.[3],
        },
      }
    : null;

  if (
    !currentQuestion ||
    !questionPanelData ||
    !session.id ||
    !currentQuestion.id
  ) {
    return (
      <div className="flex items-center justify-center h-screen">
        No questions in session
      </div>
    );
  }

  // DRAFT state: show start overlay
  if (sessionState === "DRAFT") {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center space-y-6 max-w-md">
          <h1 className="text-3xl font-bold tracking-tight">Ready to Begin</h1>
          <p className="text-muted-foreground">
            This session has {totalQuestions} question
            {totalQuestions !== 1 ? "s" : ""}.
            {timeLeft > 0 && (
              <>
                {" "}
                You have{" "}
                <span className="font-semibold">
                  {Math.floor(timeLeft / 60)}m {timeLeft % 60}s
                </span>{" "}
                to complete it.
              </>
            )}
          </p>
          <Button
            size="lg"
            onClick={handleStart}
            disabled={transitioning}
            className="w-full"
          >
            <Play className="mr-2 h-5 w-5" />
            {transitioning ? "Starting..." : "Start Session"}
          </Button>
        </div>
      </div>
    );
  }

  const isPaused = sessionState === "PAUSED";

  return (
    <>
      <HeaderBar
        currentQuestion={currentIndex + 1}
        totalQuestions={totalQuestions}
        onPreviousQuestion={handlePreviousQuestion}
        onNextQuestion={handleNextQuestion}
        onSidebarToggle={toggle}
        timeLeftSeconds={timeLeft}
        isPaused={isPaused}
        onPause={handlePause}
        onResume={handleResume}
        onEnd={handleEnd}
      />

      {isPaused && (
        <div className="bg-yellow-50 border-b border-yellow-200 px-6 py-2 text-center text-sm text-yellow-800 font-medium">
          Session paused. Resume to continue the timer.
        </div>
      )}

      <QuestionPanel
        question={questionPanelData.question}
        latexQuestion={questionPanelData.latexQuestion}
        options={questionPanelData.options}
        latexOptions={questionPanelData.latexOptions}
        selectedAnswer={answers[currentQuestion.id || ""]}
        onAnswerChange={(answer) =>
          handleAnswerChange(currentQuestion.id || "", answer)
        }
      />
      <div className="flex-1 relative overflow-hidden">
        <CanvasEditor
          key={`${session.id}-${currentQuestion.id}`}
          sessionId={session.id}
          questionId={currentQuestion.id}
          onEditorReady={(editor) => {
            editorRef.current = editor;
          }}
        />
        <DrawingToolbar
          onToolChange={(tool: CanvasTool) => {
            const toolMap: Record<CanvasTool, string> = {
              pen: "draw",
              eraser: "eraser",
              hand: "hand",
            };
            editorRef.current?.setCurrentTool(toolMap[tool] ?? "draw");
          }}
          onUndo={() => editorRef.current?.undo()}
          onRedo={() => editorRef.current?.redo()}
          onExport={async () => {
            const editor = editorRef.current;
            if (!editor) return;
            const shapeIds = editor.getCurrentPageShapeIds();
            if (shapeIds.size === 0) {
              alert("Nothing to export — draw something first!");
              return;
            }
            await exportAs(editor, [...shapeIds], {
              format: "png",
              name: `solution-q${currentIndex + 1}`,
            });
          }}
        />
        <CollaborationBar
          onMenuClick={() => console.log("Menu")}
          onMicToggle={(muted) => console.log("Mic:", muted)}
          onChatClick={() => console.log("Chat")}
          onSpeakerClick={() => console.log("Speaker")}
        />
      </div>
    </>
  );
}
