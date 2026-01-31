"use client";

import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { LatexRenderer } from "@/components/ui/latex-renderer";

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
    A?: string;
    B?: string;
    C?: string;
    D?: string;
  };
}

export function QuestionPanel({
  question,
  latexQuestion,
  options,
  latexOptions,
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
          {(["A", "B", "C", "D"] as const).map((key) => {
            const optionText = latexOptions?.[key] || options[key];
            return (
              <div key={key} className="flex items-start gap-3">
                <span className="font-medium text-gray-700 min-w-[24px]">
                  {key}.
                </span>
                <div className="text-gray-700 flex-1">
                  <LatexRenderer content={optionText} displayMode={false} />
                </div>
              </div>
            );
          })}
        </div>
      </Card>
      <Separator className="mt-4 bg-gray-200" />
    </div>
  );
}
