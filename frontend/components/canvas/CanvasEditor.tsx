"use client"

import { Tldraw } from "@tldraw/tldraw"
import "@tldraw/tldraw/tldraw.css"
import { useRef } from "react"

interface CanvasEditorProps {
  onUndo?: () => void
  onRedo?: () => void
  onToolChange?: (tool: string) => void
}

export function CanvasEditor({ onUndo, onRedo, onToolChange }: CanvasEditorProps) {
  const editorRef = useRef<any>(null)

  return (
    <div className="flex-1 w-full h-full relative bg-gray-50">
      <div
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: `radial-gradient(circle, #d1d5db 1px, transparent 1px)`,
          backgroundSize: "20px 20px",
        }}
      />
      <div className="absolute inset-0 z-10">
        <Tldraw
          onMount={(editor) => {
            editorRef.current = editor
          }}
        />
      </div>
    </div>
  )
}
