"use client"

import { Undo2, Redo2, Eraser, Pen, FileDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { cn } from "@/lib/utils"

type Tool = "pen" | "eraser"

interface DrawingToolbarProps {
  onToolChange?: (tool: Tool) => void
  onUndo?: () => void
  onRedo?: () => void
  onExport?: () => void
}

export function DrawingToolbar({
  onToolChange,
  onUndo,
  onRedo,
  onExport,
}: DrawingToolbarProps) {
  const [activeTool, setActiveTool] = useState<Tool>("pen")

  const handleToolClick = (tool: Tool) => {
    setActiveTool(tool)
    onToolChange?.(tool)
  }

  return (
    <div className="fixed right-6 top-1/2 -translate-y-1/2 z-50">
      <div className="flex flex-col gap-2 bg-white rounded-full shadow-lg p-2 border border-gray-200">
        <Button
          variant="ghost"
          size="icon"
          onClick={onUndo}
          className="h-10 w-10 rounded-full"
        >
          <Undo2 className="h-5 w-5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={onRedo}
          className="h-10 w-10 rounded-full"
        >
          <Redo2 className="h-5 w-5" />
        </Button>
        <div className="h-px bg-gray-200 my-1" />
        <Button
          variant="ghost"
          size="icon"
          onClick={() => handleToolClick("eraser")}
          className={cn(
            "h-10 w-10 rounded-full",
            activeTool === "eraser" && "bg-gray-100"
          )}
        >
          <Eraser className="h-5 w-5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => handleToolClick("pen")}
          className={cn(
            "h-10 w-10 rounded-full",
            activeTool === "pen" && "bg-gray-100"
          )}
        >
          <Pen className="h-5 w-5" />
        </Button>
      </div>
      <div className="fixed right-6 bottom-6 z-50">
        <Button
          variant="ghost"
          size="icon"
          onClick={onExport}
          className="h-10 w-10 rounded-full bg-white shadow-lg border border-gray-200"
        >
          <FileDown className="h-5 w-5" />
        </Button>
      </div>
    </div>
  )
}
