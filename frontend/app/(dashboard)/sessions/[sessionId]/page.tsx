import { backendClient } from "@/lib/backend-client"
import { 
  GenericResponseSessionDto, 
  GenericResponseQuestionDto,
  SessionDto,
  QuestionDto 
} from "@/lib/backend/types.gen"
import { notFound } from "next/navigation"
import { SessionPlayer } from "./SessionPlayer"

export default async function SessionPage({
  params,
}: {
  params: { sessionId: string }
}) {
  const { sessionId } = await params

  // Fetch session
  let session: SessionDto | null = null
  try {
    const response = await backendClient.get<GenericResponseSessionDto>({
      url: `/sessions/${sessionId}`
    })
    session = response.data?.data || null
  } catch (err) {
    console.error('Failed to fetch session:', err)
  }

  if (!session) {
    notFound()
  }

  // Fetch all questions in the session
  const questions: QuestionDto[] = []
  if (session.questionIds) {
    for (const questionId of session.questionIds) {
      try {
        const response = await backendClient.get<GenericResponseQuestionDto>({
          url: `/questions/${questionId}`
        })
        if (response.data?.data) {
          questions.push(response.data.data)
        }
      } catch (err) {
        console.error(`Failed to fetch question ${questionId}:`, err)
      }
    }
  }

  return (
    <SessionPlayer 
      session={session} 
      questions={questions}
    />
  )
}
