"use client"

import { ArrowLeft, ChevronLeft, ChevronRight, ThumbsUp, Bell, HelpCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"

interface HeaderBarProps {
  currentQuestion: number
  totalQuestions: number
  onPreviousQuestion: () => void
  onNextQuestion: () => void
}

export function HeaderBar({
  currentQuestion,
  totalQuestions,
  onPreviousQuestion,
  onNextQuestion,
}: HeaderBarProps) {
  const router = useRouter()
  const [timer, setTimer] = useState(0) // Timer in seconds

  useEffect(() => {
    const interval = setInterval(() => {
      setTimer((prev) => prev + 1)
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return `${String(hrs).padStart(2, "0")}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`
  }

  return (
    <header className="w-full bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
      {/* Left section */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
          className="h-9 w-9"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="text-lg font-medium text-gray-900">
          {formatTime(timer)}
        </div>
      </div>

      {/* Center section - Question navigation */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={onPreviousQuestion}
          disabled={currentQuestion === 1}
          className="h-9 w-9"
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <div className="text-sm font-medium text-gray-700">
          Q {currentQuestion}/{totalQuestions}
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onNextQuestion}
          disabled={currentQuestion === totalQuestions}
          className="h-9 w-9"
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>

      {/* Right section */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center">
            <span className="text-xs font-medium text-gray-700">U</span>
          </div>
          <Badge variant="secondary" className="bg-blue-100 text-blue-700">
            FREE TRIAL
          </Badge>
        </div>
        <Button variant="ghost" size="icon" className="h-9 w-9">
          <ThumbsUp className="h-5 w-5" />
        </Button>
        <Button variant="ghost" size="icon" className="h-9 w-9">
          <Bell className="h-5 w-5" />
        </Button>
        <Button variant="ghost" size="icon" className="h-9 w-9">
          <HelpCircle className="h-5 w-5" />
        </Button>
      </div>
    </header>
  )
}
