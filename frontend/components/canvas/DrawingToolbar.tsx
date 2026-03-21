"use client";

import { Undo2, Redo2, Eraser, Pen, FileDown, Hand } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { cn } from "@/lib/utils";

type Tool = "pen" | "eraser" | "hand";

interface DrawingToolbarProps {
  onToolChange?: (tool: Tool) => void;
  onUndo?: () => void;
  onRedo?: () => void;
  onExport?: () => void;
}

export function DrawingToolbar({
  onToolChange,
  onUndo,
  onRedo,
  onExport,
}: DrawingToolbarProps) {
  const [activeTool, setActiveTool] = useState<Tool>("pen");

  const handleToolClick = (tool: Tool) => {
    setActiveTool(tool);
    onToolChange?.(tool);
  };

  return (
    <div className="fixed right-6 top-1/2 -translate-y-1/2 z-50">
      <div className="flex flex-col gap-2 bg-background rounded-full shadow-lg p-2 border border-border">
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
        <div className="h-px bg-border my-1" />
        <Button
          variant="ghost"
          size="icon"
          onClick={() => handleToolClick("eraser")}
          className={cn(
            "h-10 w-10 rounded-full",
            activeTool === "eraser" && "bg-muted",
          )}
        >
          <Eraser className="h-5 w-5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => handleToolClick("hand")}
          className={cn(
            "h-10 w-10 rounded-full",
            activeTool === "hand" && "bg-muted",
          )}
        >
          <Hand className="h-5 w-5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => handleToolClick("pen")}
          className={cn(
            "h-10 w-10 rounded-full",
            activeTool === "pen" && "bg-muted",
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
          className="h-10 w-10 rounded-full bg-background shadow-lg border border-border"
        >
          <FileDown className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}
