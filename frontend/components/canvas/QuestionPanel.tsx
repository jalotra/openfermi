"use client";

import { Card } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { LatexRenderer } from "@/components/ui/latex-renderer"
import { cn } from "@/lib/utils"

interface QuestionPanelProps {
  question: string;
  latexQuestion?: string; // LaTeX version of the question
  options: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  latexOptions?: {
    A?: string
    B?: string
    C?: string
    D?: string
  }
  selectedAnswer?: string
  onAnswerChange?: (answer: string) => void
}

export function QuestionPanel({
  question,
  latexQuestion,
  options,
  latexOptions,
  selectedAnswer,
  onAnswerChange
}: QuestionPanelProps) {
  // Use LaTeX version if available, otherwise fallback to plain text
  const questionContent = latexQuestion || question;

  return (
    <div className="w-full px-6 py-4">
      <Card className="p-6 bg-white rounded-lg shadow-sm">
        <div className="mb-6">
          <div className="text-base text-gray-900 leading-relaxed">
            <LatexRenderer content={questionContent} displayMode={false} />
          </div>
        </div>
        <div className="space-y-3">
          {(['A', 'B', 'C', 'D'] as const).map((key) => {
            const optionText = latexOptions?.[key] || options[key]
            const isSelected = selectedAnswer === key
            return (
              <button
                key={key}
                onClick={() => onAnswerChange?.(key)}
                className={cn(
                  "flex items-start gap-3 w-full text-left p-3 rounded-lg transition-colors",
                  "hover:bg-gray-50",
                  isSelected && "bg-blue-50 border-2 border-blue-500 hover:bg-blue-50"
                )}
              >
                <span className={cn(
                  "font-medium min-w-[24px]",
                  isSelected ? "text-blue-700" : "text-gray-700"
                )}>
                  {key}.
                </span>
                <div className={cn(
                  "flex-1",
                  isSelected ? "text-blue-900" : "text-gray-700"
                )}>
                  <LatexRenderer content={optionText} displayMode={false} />
                </div>
              </button>
            )
          })}
        </div>
      </Card>
      <Separator className="mt-4 bg-gray-200" />
    </div>
  );
}
