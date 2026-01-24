"use client"

import { Card } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

interface QuestionPanelProps {
  question: string
  options: {
    A: string
    B: string
    C: string
    D: string
  }
}

export function QuestionPanel({ question, options }: QuestionPanelProps) {
  return (
    <div className="w-full px-6 py-4">
      <Card className="p-6 bg-white rounded-lg shadow-sm">
        <div className="mb-6">
          <p className="text-base text-gray-900 leading-relaxed">{question}</p>
        </div>
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <span className="font-medium text-gray-700 min-w-[24px]">A.</span>
            <span className="text-gray-700">{options.A}</span>
          </div>
          <div className="flex items-start gap-3">
            <span className="font-medium text-gray-700 min-w-[24px]">B.</span>
            <span className="text-gray-700">{options.B}</span>
          </div>
          <div className="flex items-start gap-3">
            <span className="font-medium text-gray-700 min-w-[24px]">C.</span>
            <span className="text-gray-700">{options.C}</span>
          </div>
          <div className="flex items-start gap-3">
            <span className="font-medium text-gray-700 min-w-[24px]">D.</span>
            <span className="text-gray-700">{options.D}</span>
          </div>
        </div>
      </Card>
      <Separator className="mt-4 bg-gray-200" />
    </div>
  )
}
