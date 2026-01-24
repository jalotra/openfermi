"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { HeaderBar } from "@/components/canvas/HeaderBar"
import { QuestionPanel } from "@/components/canvas/QuestionPanel"
import { CanvasEditor } from "@/components/canvas/CanvasEditor"
import { DrawingToolbar } from "@/components/canvas/DrawingToolbar"
import { CollaborationBar } from "@/components/canvas/CollaborationBar"

// Mock question data - in a real app, this would come from an API
const mockQuestions = [
  {
    id: "1",
    question: "What is the derivative of f(x) = x² + 3x - 5?",
    options: {
      A: "2x + 3",
      B: "2x - 3",
      C: "x² + 3",
      D: "2x² + 3x",
    },
  },
  {
    id: "2",
    question: "Solve the equation: 2x + 5 = 13",
    options: {
      A: "x = 4",
      B: "x = 5",
      C: "x = 6",
      D: "x = 7",
    },
  },
  {
    id: "3",
    question: "What is the area of a circle with radius 5?",
    options: {
      A: "10π",
      B: "25π",
      C: "50π",
      D: "100π",
    },
  },
  {
    id: "4",
    question: "Find the limit: lim(x→0) sin(x)/x",
    options: {
      A: "0",
      B: "1",
      C: "∞",
      D: "Does not exist",
    },
  },
  {
    id: "5",
    question: "What is the integral of 3x²?",
    options: {
      A: "x³",
      B: "x³ + C",
      C: "3x³",
      D: "3x³ + C",
    },
  },
]

export default function CanvasPage({
  params,
}: {
  params: { questionId: string }
}) {
  const router = useRouter()
  const questionId = params.questionId
  const currentIndex = mockQuestions.findIndex((q) => q.id === questionId)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(
    currentIndex >= 0 ? currentIndex : 0
  )

  // Sync state with URL parameter when it changes
  useEffect(() => {
    const index = mockQuestions.findIndex((q) => q.id === questionId)
    if (index >= 0) {
      setCurrentQuestionIndex(index)
    }
  }, [questionId])

  const currentQuestion = mockQuestions[currentQuestionIndex]

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      const newIndex = currentQuestionIndex - 1
      router.push(`/canvas/${mockQuestions[newIndex].id}`)
    }
  }

  const handleNextQuestion = () => {
    if (currentQuestionIndex < mockQuestions.length - 1) {
      const newIndex = currentQuestionIndex + 1
      router.push(`/canvas/${mockQuestions[newIndex].id}`)
    }
  }

  const handleToolChange = (tool: string) => {
    console.log("Tool changed to:", tool)
  }

  const handleUndo = () => {
    console.log("Undo")
  }

  const handleRedo = () => {
    console.log("Redo")
  }

  const handleExport = () => {
    console.log("Export")
  }

  const handleMicToggle = (muted: boolean) => {
    console.log("Mic toggled:", muted)
  }

  const handleChatClick = () => {
    console.log("Chat clicked")
  }

  const handleSpeakerClick = () => {
    console.log("Speaker clicked")
  }

  const handleMenuClick = () => {
    console.log("Menu clicked")
  }

  if (!currentQuestion) {
    return <div>Question not found</div>
  }

  return (
    <div className="flex flex-col h-screen bg-white overflow-hidden">
      <HeaderBar
        currentQuestion={currentQuestionIndex + 1}
        totalQuestions={mockQuestions.length}
        onPreviousQuestion={handlePreviousQuestion}
        onNextQuestion={handleNextQuestion}
      />
      <QuestionPanel
        question={currentQuestion.question}
        options={currentQuestion.options}
      />
      <div className="flex-1 relative overflow-hidden">
        <CanvasEditor
          onUndo={handleUndo}
          onRedo={handleRedo}
          onToolChange={handleToolChange}
        />
        <DrawingToolbar
          onToolChange={handleToolChange}
          onUndo={handleUndo}
          onRedo={handleRedo}
          onExport={handleExport}
        />
        <CollaborationBar
          onMenuClick={handleMenuClick}
          onMicToggle={handleMicToggle}
          onChatClick={handleChatClick}
          onSpeakerClick={handleSpeakerClick}
        />
      </div>
    </div>
  )
}
