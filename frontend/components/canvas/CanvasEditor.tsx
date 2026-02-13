"use client";

import { Tldraw, getSnapshot, loadSnapshot } from "@tldraw/tldraw";
import "@tldraw/tldraw/tldraw.css";
import { useCallback, useEffect, useRef } from "react";
import { fetchSessionState, upsertSessionState } from "@/lib/session-state";

export type CanvasTool = "pen" | "eraser" | "hand";

interface CanvasEditorProps {
  sessionId: string;
  questionId: string;
  onEditorReady?: (editor: any) => void;
}

const TOOL_MAP: Record<CanvasTool, string> = {
  pen: "draw",
  eraser: "eraser",
  hand: "hand",
};

export function CanvasEditor({
  sessionId,
  questionId,
  onEditorReady,
}: CanvasEditorProps) {
  const editorRef = useRef<any>(null);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isApplyingSnapshotRef = useRef(false);
  const lastSavedRef = useRef<string | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  const saveSnapshot = useCallback(async () => {
    const editor = editorRef.current;
    if (!editor || !sessionId || !questionId) return;

    const snapshot = getSnapshot(editor.store);
    const serialized = JSON.stringify(snapshot);

    if (serialized === lastSavedRef.current) {
      return;
    }

    lastSavedRef.current = serialized;

    await upsertSessionState({
      sessionId,
      questionId,
      tldrawSnapshot: snapshot,
    });
  }, [questionId, sessionId]);

  const scheduleSave = useCallback(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = setTimeout(() => {
      saveSnapshot().catch((err) => {
        console.error("Failed to save canvas state:", err);
      });
    }, 1500);
  }, [saveSnapshot]);

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      unsubscribeRef.current?.();
      saveSnapshot().catch((err) => {
        console.error("Failed to save canvas state on unmount:", err);
      });
    };
  }, [saveSnapshot]);

  const handleMount = useCallback(
    (editor: any) => {
      editorRef.current = editor;
      onEditorReady?.(editor);

      editor.setCameraOptions({
        wheelBehavior: "none",
        isLocked: true,
        zoomSteps: [1],
      });
      editor.setCamera({ x: 0, y: 0, z: 1 });

      editor.setCurrentTool(TOOL_MAP.pen);
      unsubscribeRef.current?.();
      unsubscribeRef.current = editor.store.listen(() => {
        if (isApplyingSnapshotRef.current) return;
        scheduleSave();
      });

      fetchSessionState(sessionId, questionId)
        .then((state) => {
          if (state?.data?.tldrawSnapshot) {
            isApplyingSnapshotRef.current = true;
            try {
              loadSnapshot(editor.store, state.data.tldrawSnapshot);
              lastSavedRef.current = JSON.stringify(state.data.tldrawSnapshot);
            } finally {
              isApplyingSnapshotRef.current = false;
            }
          }
        })
        .catch((err) => {
          console.error("Failed to load canvas state:", err);
        });
    },
    [onEditorReady, questionId, sessionId, scheduleSave],
  );

  return (
    <div className="w-full h-full">
      <Tldraw hideUi onMount={handleMount} />
    </div>
  );
}
