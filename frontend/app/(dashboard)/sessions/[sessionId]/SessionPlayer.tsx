'use client'

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { HeaderBar } from "@/components/canvas/HeaderBar"
import { QuestionPanel } from "@/components/canvas/QuestionPanel"
import { CanvasEditor } from "@/components/canvas/CanvasEditor"
import { DrawingToolbar } from "@/components/canvas/DrawingToolbar"
import { CollaborationBar } from "@/components/canvas/CollaborationBar"
import { useSidebar } from "@/components/canvas/SidebarContext"
import { SessionDto, QuestionDto } from "@/lib/backend/types.gen"
import { backendClient } from "@/lib/backend-client"

interface SessionPlayerProps {
  session: SessionDto
  questions: QuestionDto[]
}

export function SessionPlayer({ session, questions }: SessionPlayerProps) {
  const router = useRouter()
  const { toggle } = useSidebar()
  
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>(session.answers || {})
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle')
  const [startTime] = useState(Date.now())

  const currentQuestion = questions[currentIndex]
  const totalQuestions = questions.length

  // Auto-save with debounce (2 seconds)
  useEffect(() => {
    if (saveStatus === 'idle') return
    
    const timer = setTimeout(async () => {
      if (saveStatus === 'saving') {
        await saveAnswers()
      }
    }, 2000)

    return () => clearTimeout(timer)
  }, [answers, saveStatus])

  const saveAnswers = async () => {
    try {
      await backendClient.put({
        url: `/sessions/${session.id}`,
        body: {
          answers,
          timeSpentSeconds: Math.floor((Date.now() - startTime) / 1000)
        }
      })
      setSaveStatus('saved')
      setTimeout(() => setSaveStatus('idle'), 1000)
    } catch (err) {
      console.error('Failed to save answers:', err)
      setSaveStatus('idle')
    }
  }

  const handleAnswerChange = useCallback((questionId: string, answer: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: answer }))
    setSaveStatus('saving')
  }, [])

  const handlePreviousQuestion = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1)
    }
  }

  const handleNextQuestion = () => {
    if (currentIndex < totalQuestions - 1) {
      setCurrentIndex(prev => prev + 1)
    }
  }

  const handleFinish = async () => {
    // Calculate score
    let correct = 0
    let incorrect = 0
    let unanswered = 0

    questions.forEach(q => {
      const userAnswer = answers[q.id || '']
      if (!userAnswer) {
        unanswered++
      } else if (userAnswer === q.correctAnswer) {
        correct++
      } else {
        incorrect++
      }
    })

    const score = totalQuestions > 0 ? (correct / totalQuestions) * 100 : 0

    try {
      await backendClient.put({
        url: `/sessions/${session.id}`,
        body: {
          status: 'COMPLETED',
          endTime: new Date().toISOString(),
          score,
          correctAnswers: correct,
          incorrectAnswers: incorrect,
          unanswered,
          answers,
          timeSpentSeconds: Math.floor((Date.now() - startTime) / 1000)
        }
      })
      router.push(`/sessions`)
    } catch (err) {
      console.error('Failed to complete session:', err)
    }
  }

  // Convert QuestionDto to QuestionPanel format
  const questionPanelData = currentQuestion ? {
    question: currentQuestion.questionText || '',
    latexQuestion: currentQuestion.questionText || '', // TODO: Add LaTeX support
    options: {
      A: currentQuestion.options?.[0] || '',
      B: currentQuestion.options?.[1] || '',
      C: currentQuestion.options?.[2] || '',
      D: currentQuestion.options?.[3] || '',
    },
    latexOptions: {
      A: currentQuestion.options?.[0],
      B: currentQuestion.options?.[1],
      C: currentQuestion.options?.[2],
      D: currentQuestion.options?.[3],
    }
  } : null

  if (!currentQuestion) {
    return <div className="flex items-center justify-center h-screen">No questions in session</div>
  }

  return (
    <>
      <HeaderBar
        currentQuestion={currentIndex + 1}
        totalQuestions={totalQuestions}
        onPreviousQuestion={handlePreviousQuestion}
        onNextQuestion={handleNextQuestion}
        onSidebarToggle={toggle}
        saveStatus={saveStatus}
        onFinish={currentIndex === totalQuestions - 1 ? handleFinish : undefined}
      />
      <QuestionPanel
        question={questionPanelData.question}
        latexQuestion={questionPanelData.latexQuestion}
        options={questionPanelData.options}
        latexOptions={questionPanelData.latexOptions}
        selectedAnswer={answers[currentQuestion.id || '']}
        onAnswerChange={(answer) => handleAnswerChange(currentQuestion.id || '', answer)}
      />
      <div className="flex-1 relative overflow-hidden">
        <CanvasEditor
          onUndo={() => console.log("Undo")}
          onRedo={() => console.log("Redo")}
          onToolChange={(tool) => console.log("Tool:", tool)}
        />
        <DrawingToolbar
          onToolChange={(tool) => console.log("Tool:", tool)}
          onUndo={() => console.log("Undo")}
          onRedo={() => console.log("Redo")}
          onExport={() => console.log("Export")}
        />
        <CollaborationBar
          onMenuClick={() => console.log("Menu")}
          onMicToggle={(muted) => console.log("Mic:", muted)}
          onChatClick={() => console.log("Chat")}
          onSpeakerClick={() => console.log("Speaker")}
        />
      </div>
    </>
  )
}
