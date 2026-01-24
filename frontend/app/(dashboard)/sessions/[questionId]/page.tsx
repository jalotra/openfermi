"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { HeaderBar } from "@/components/canvas/HeaderBar"
import { QuestionPanel } from "@/components/canvas/QuestionPanel"
import { CanvasEditor } from "@/components/canvas/CanvasEditor"
import { DrawingToolbar } from "@/components/canvas/DrawingToolbar"
import { CollaborationBar } from "@/components/canvas/CollaborationBar"
import { useSidebar } from "@/components/canvas/SidebarContext"
import { mockQuestions } from "@/lib/data"

export default function CanvasPage({
  params,
}: {
  params: { questionId: string }
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toggle } = useSidebar()
  const questionId = params.questionId

  const sessionQuestions = useMemo(() => {
    const idsParam = searchParams.get("ids")
    if (!idsParam) return mockQuestions
    const ids = idsParam.split(",").map((s) => s.trim())
    return ids
      .map((id) => mockQuestions.find((q) => q.id === id))
      .filter(Boolean) as typeof mockQuestions
  }, [searchParams])

  const currentIndex = sessionQuestions.findIndex((q) => q.id === questionId)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(
    currentIndex >= 0 ? currentIndex : 0
  )

  useEffect(() => {
    const index = sessionQuestions.findIndex((q) => q.id === questionId)
    if (index >= 0) {
      setCurrentQuestionIndex(index)
    }
  }, [questionId, sessionQuestions])

  const currentQuestion = sessionQuestions[currentQuestionIndex]

  const idsQuery =
    sessionQuestions.length > 0 && sessionQuestions.length < mockQuestions.length
      ? `?ids=${sessionQuestions.map((q) => q.id).join(",")}`
      : ""

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      const newIndex = currentQuestionIndex - 1
      router.push(`/sessions/${sessionQuestions[newIndex].id}${idsQuery}`)
    }
  }

  const handleNextQuestion = () => {
    if (currentQuestionIndex < sessionQuestions.length - 1) {
      const newIndex = currentQuestionIndex + 1
      router.push(`/sessions/${sessionQuestions[newIndex].id}${idsQuery}`)
    }
  }

  const handleToolChange = (tool: string) => console.log("Tool changed to:", tool)
  const handleUndo = () => console.log("Undo")
  const handleRedo = () => console.log("Redo")
  const handleExport = () => console.log("Export")
  const handleMicToggle = (muted: boolean) => console.log("Mic toggled:", muted)
  const handleChatClick = () => console.log("Chat clicked")
  const handleSpeakerClick = () => console.log("Speaker clicked")
  const handleMenuClick = () => console.log("Menu clicked")

  if (!currentQuestion) return <div>Question not found</div>

  return (
    <>
      <HeaderBar
        currentQuestion={currentQuestionIndex + 1}
        totalQuestions={sessionQuestions.length}
        onPreviousQuestion={handlePreviousQuestion}
        onNextQuestion={handleNextQuestion}
        onSidebarToggle={toggle}
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
    </>
  )
}
