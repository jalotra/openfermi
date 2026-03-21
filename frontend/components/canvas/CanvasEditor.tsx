"use client";

import {
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  forwardRef,
} from "react";
import { getStroke } from "perfect-freehand";
import {
  StrokeData,
  DrawingData,
  getSvgPathFromStroke,
  hitTestStroke,
  exportSvgToPng,
  generateStrokeId,
} from "@/lib/drawing-utils";
import { fetchSessionState, upsertSessionState } from "@/lib/session-state";

export type CanvasTool = "pen" | "eraser" | "hand";

export interface CanvasEditorHandle {
  undo: () => void;
  redo: () => void;
  exportPng: (filename: string) => Promise<void>;
  setTool: (tool: CanvasTool) => void;
}

interface CanvasEditorProps {
  sessionId: string;
  questionId: string;
  penColor?: string;
  penSize?: number;
}

const STROKE_OPTIONS = {
  size: 4,
  thinning: 0.5,
  smoothing: 0.5,
  streamline: 0.5,
  simulatePressure: false,
  start: { cap: true, taper: 0 },
  end: { cap: true, taper: 0 },
};

const MIN_CANVAS_HEIGHT = 2000;
const CANVAS_PADDING = 1000;
const EXPAND_THRESHOLD = 200;

function computeMaxY(allStrokes: StrokeData[]): number {
  let maxY = 0;
  for (const s of allStrokes) {
    for (const p of s.points) {
      if (p[1] > maxY) maxY = p[1];
    }
  }
  return maxY;
}

function computeNeededHeight(allStrokes: StrokeData[]): number {
  const maxY = computeMaxY(allStrokes);
  return Math.max(MIN_CANVAS_HEIGHT, maxY + CANVAS_PADDING);
}

export const CanvasEditor = forwardRef<CanvasEditorHandle, CanvasEditorProps>(
  function CanvasEditor(
    { sessionId, questionId, penColor = "#000000", penSize = 4 },
    ref,
  ) {
    const svgRef = useRef<SVGSVGElement>(null);
    const [strokes, setStrokes] = useState<StrokeData[]>([]);
    const [currentPoints, setCurrentPoints] = useState<number[][] | null>(null);
    const [tool, setTool] = useState<CanvasTool>("pen");
    const [undoStack, setUndoStack] = useState<StrokeData[][]>([]);
    const [redoStack, setRedoStack] = useState<StrokeData[][]>([]);
    const [canvasHeight, setCanvasHeight] = useState(MIN_CANVAS_HEIGHT);

    const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const lastSavedRef = useRef<string | null>(null);
    const isLoadingRef = useRef(false);

    const saveStrokes = useCallback(
      async (strokesData: StrokeData[]) => {
        if (!sessionId || !questionId) return;

        const drawingData: DrawingData = { strokes: strokesData };
        const serialized = JSON.stringify(drawingData);

        if (serialized === lastSavedRef.current) return;
        lastSavedRef.current = serialized;

        await upsertSessionState({
          sessionId,
          questionId,
          drawingStrokes: drawingData,
        });
      },
      [sessionId, questionId],
    );

    const scheduleSave = useCallback(
      (strokesData: StrokeData[]) => {
        if (saveTimeoutRef.current) {
          clearTimeout(saveTimeoutRef.current);
        }
        saveTimeoutRef.current = setTimeout(() => {
          saveStrokes(strokesData).catch((err) => {
            console.error("Failed to save drawing:", err);
          });
        }, 1500);
      },
      [saveStrokes],
    );

    useEffect(() => {
      isLoadingRef.current = true;
      fetchSessionState(sessionId, questionId)
        .then((state) => {
          const drawingData = state?.data?.drawingStrokes as
            | DrawingData
            | undefined;
          if (drawingData?.strokes) {
            setStrokes(drawingData.strokes);
            setCanvasHeight(computeNeededHeight(drawingData.strokes));
            lastSavedRef.current = JSON.stringify(drawingData);
          }
        })
        .catch((err) => {
          console.error("Failed to load drawing:", err);
        })
        .finally(() => {
          isLoadingRef.current = false;
        });
    }, [sessionId, questionId]);

    useEffect(() => {
      return () => {
        if (saveTimeoutRef.current) {
          clearTimeout(saveTimeoutRef.current);
        }
        if (!isLoadingRef.current) {
          saveStrokes(strokes).catch((err) => {
            console.error("Failed to save drawing on unmount:", err);
          });
        }
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const pushUndo = useCallback((prevStrokes: StrokeData[]) => {
      setUndoStack((prev) => [...prev.slice(-49), prevStrokes]);
      setRedoStack([]);
    }, []);

    const undo = useCallback(() => {
      setUndoStack((prev) => {
        if (prev.length === 0) return prev;
        const newUndo = [...prev];
        const restored = newUndo.pop()!;
        setStrokes((current) => {
          setRedoStack((r) => [...r, current]);
          scheduleSave(restored);
          return restored;
        });
        setCanvasHeight(computeNeededHeight(restored));
        return newUndo;
      });
    }, [scheduleSave]);

    const redo = useCallback(() => {
      setRedoStack((prev) => {
        if (prev.length === 0) return prev;
        const newRedo = [...prev];
        const restored = newRedo.pop()!;
        setStrokes((current) => {
          setUndoStack((u) => [...u, current]);
          scheduleSave(restored);
          return restored;
        });
        setCanvasHeight(computeNeededHeight(restored));
        return newRedo;
      });
    }, [scheduleSave]);

    const exportPng = useCallback(
      async (filename: string) => {
        const svg = svgRef.current;
        if (!svg) return;
        if (strokes.length === 0) {
          alert("Nothing to export — draw something first!");
          return;
        }
        await exportSvgToPng(svg, filename);
      },
      [strokes],
    );

    useImperativeHandle(
      ref,
      () => ({
        undo,
        redo,
        exportPng,
        setTool,
      }),
      [undo, redo, exportPng],
    );

    const getPointerPos = useCallback(
      (e: React.PointerEvent<SVGSVGElement>): [number, number] => {
        const svg = svgRef.current;
        if (!svg) return [e.clientX, e.clientY];
        const rect = svg.getBoundingClientRect();
        return [e.clientX - rect.left, e.clientY - rect.top];
      },
      [],
    );

    const handlePointerDown = useCallback(
      (e: React.PointerEvent<SVGSVGElement>) => {
        if (tool === "hand") return;
        e.currentTarget.setPointerCapture(e.pointerId);
        const [x, y] = getPointerPos(e);

        if (tool === "eraser") {
          const hit = strokes.findIndex((s) => hitTestStroke(s, [x, y]));
          if (hit !== -1) {
            pushUndo(strokes);
            const next = strokes.filter((_, i) => i !== hit);
            setStrokes(next);
            scheduleSave(next);
          }
          return;
        }

        setCurrentPoints([[x, y, e.pressure]]);
      },
      [tool, strokes, getPointerPos, pushUndo, scheduleSave],
    );

    const handlePointerMove = useCallback(
      (e: React.PointerEvent<SVGSVGElement>) => {
        if (tool === "hand") return;
        const [x, y] = getPointerPos(e);

        if (tool === "eraser" && e.buttons === 1) {
          const hit = strokes.findIndex((s) => hitTestStroke(s, [x, y]));
          if (hit !== -1) {
            pushUndo(strokes);
            const next = strokes.filter((_, i) => i !== hit);
            setStrokes(next);
            scheduleSave(next);
          }
          return;
        }

        if (e.buttons !== 1 || !currentPoints) return;
        setCurrentPoints((prev) =>
          prev ? [...prev, [x, y, e.pressure]] : null,
        );
        if (y > canvasHeight - EXPAND_THRESHOLD) {
          setCanvasHeight((h) => h + CANVAS_PADDING);
        }
      },
      [
        tool,
        currentPoints,
        strokes,
        getPointerPos,
        pushUndo,
        scheduleSave,
        canvasHeight,
      ],
    );

    const handlePointerUp = useCallback(() => {
      if (tool !== "pen" || !currentPoints || currentPoints.length === 0) {
        setCurrentPoints(null);
        return;
      }

      const newStroke: StrokeData = {
        id: generateStrokeId(),
        points: currentPoints,
        color: penColor,
        size: penSize,
        timestamp: Date.now(),
      };

      pushUndo(strokes);
      const next = [...strokes, newStroke];
      setStrokes(next);
      setCanvasHeight(computeNeededHeight(next));
      scheduleSave(next);
      setCurrentPoints(null);
    }, [
      tool,
      currentPoints,
      penColor,
      penSize,
      strokes,
      pushUndo,
      scheduleSave,
    ]);

    const renderStroke = useCallback((strokeData: StrokeData) => {
      const outlinePoints = getStroke(strokeData.points, {
        ...STROKE_OPTIONS,
        size: strokeData.size,
      });
      const pathData = getSvgPathFromStroke(outlinePoints);
      if (!pathData) return null;
      return (
        <path
          key={strokeData.id}
          d={pathData}
          fill={strokeData.color}
          stroke="none"
        />
      );
    }, []);

    const currentOutline =
      currentPoints && currentPoints.length > 1
        ? getStroke(currentPoints, { ...STROKE_OPTIONS, size: penSize })
        : null;
    const currentPath = currentOutline
      ? getSvgPathFromStroke(currentOutline)
      : null;

    const cursorClass =
      tool === "hand"
        ? "cursor-grab"
        : tool === "eraser"
          ? "cursor-crosshair"
          : "cursor-crosshair";

    return (
      <div className="w-full" style={{ height: canvasHeight }}>
        <svg
          ref={svgRef}
          width="100%"
          height={canvasHeight}
          className={cursorClass}
          style={{
            touchAction: tool === "hand" ? "auto" : "none",
          }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
        >
          {strokes.map(renderStroke)}
          {currentPath && (
            <path d={currentPath} fill={penColor} stroke="none" />
          )}
        </svg>
      </div>
    );
  },
);
