"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { LatexRenderer } from "@/components/ui/latex-renderer";
import { cn } from "@/lib/utils";
import { ImageIcon, ChevronDown } from "lucide-react";

interface QuestionPanelProps {
  question: string;
  latexQuestion?: string;
  options: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  latexOptions?: {
    A?: string;
    B?: string;
    C?: string;
    D?: string;
  };
  imageUrls?: string[];
  selectedAnswer?: string;
  onAnswerChange?: (answer: string) => void;
}

export function QuestionPanel({
  question,
  latexQuestion,
  options,
  latexOptions,
  imageUrls,
  selectedAnswer,
  onAnswerChange,
}: QuestionPanelProps) {
  const [imageExpanded, setImageExpanded] = useState(false);
  const questionContent = latexQuestion || question;

  return (
    <div className="w-full px-6 py-4">
      <Card className="p-6 bg-white rounded-lg shadow-sm">
        <div className="mb-6">
          <div className="text-base text-gray-900 leading-relaxed">
            <LatexRenderer content={questionContent} displayMode={false} />
          </div>
        </div>
        {imageUrls && imageUrls.length > 0 && (
          <div className="mb-4">
            <button
              type="button"
              onClick={() => setImageExpanded((prev) => !prev)}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ImageIcon className="h-4 w-4" />
              <span>View Question Image{imageUrls.length > 1 ? "s" : ""}</span>
              <ChevronDown
                className={cn(
                  "h-4 w-4 transition-transform",
                  imageExpanded && "rotate-180",
                )}
              />
            </button>
            {imageExpanded && (
              <div className="mt-3 space-y-3">
                {imageUrls.map((url, i) => (
                  <img
                    key={i}
                    src={url}
                    alt={`Question image ${i + 1}`}
                    className="max-w-full rounded-lg border"
                  />
                ))}
              </div>
            )}
          </div>
        )}
        <div className="space-y-3">
          {(["A", "B", "C", "D"] as const).map((key) => {
            const optionText = latexOptions?.[key] || options[key];
            const isSelected = selectedAnswer === key;
            return (
              <button
                key={key}
                onClick={() => onAnswerChange?.(key)}
                className={cn(
                  "flex items-start gap-3 w-full text-left p-3 rounded-lg transition-colors",
                  "hover:bg-gray-50",
                  isSelected &&
                    "bg-blue-50 border-2 border-blue-500 hover:bg-blue-50",
                )}
              >
                <span
                  className={cn(
                    "font-medium min-w-[24px]",
                    isSelected ? "text-blue-700" : "text-gray-700",
                  )}
                >
                  {key}.
                </span>
                <div
                  className={cn(
                    "flex-1",
                    isSelected ? "text-blue-900" : "text-gray-700",
                  )}
                >
                  <LatexRenderer content={optionText} displayMode={false} />
                </div>
              </button>
            );
          })}
        </div>
      </Card>
      <Separator className="mt-4 bg-gray-200" />
    </div>
  );
}
