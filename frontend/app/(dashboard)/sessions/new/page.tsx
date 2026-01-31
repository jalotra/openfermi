import { backendClient } from "@/lib/backend-client"
import { 
  GenericResponseQuestionDto, 
  QuestionDto,
  GenericResponseSessionDto 
} from "@/lib/backend/types.gen"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Play } from "lucide-react"
import Link from "next/link"
import { redirect } from "next/navigation"

// Server Action to create session
async function createSession(formData: FormData) {
  'use server'
  
  const questionIds = formData.get('questionIds') as string
  const ids = questionIds.split(',').filter(Boolean)
  
  if (ids.length === 0) {
    throw new Error('No questions selected')
  }

  const response = await backendClient.post<GenericResponseSessionDto>({
    url: '/sessions',
    body: {
      userId: 'anonymous', // TODO: Add auth later
      questionIds: ids,
      status: 'IN_PROGRESS',
      startTime: new Date().toISOString(),
      totalQuestions: ids.length,
      examType: 'MIXED',
      subject: 'MIXED'
    }
  })

  if (!response.data) {
    throw new Error('Failed to create session')
  }
  
  const genericResponse = response.data as GenericResponseSessionDto
  const session = genericResponse.data
  if (session?.id) {
    redirect(`/sessions/${session.id}`)
  }
}

export default async function NewSessionPage({
  searchParams,
}: {
  searchParams: { questionIds: string }
}) {
  const { questionIds } = await searchParams
  const ids = questionIds?.split(',').filter(Boolean) || []

  if (ids.length === 0) {
    return (
      <div className="flex-1 flex flex-col min-h-screen bg-white p-8">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-2xl font-bold mb-4">No Questions Selected</h1>
          <p className="text-muted-foreground mb-6">
            Please go back to the Questions page and select questions for your session.
          </p>
          <Link href="/questions">
            <Button>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Questions
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  // Fetch selected questions
  const questions: QuestionDto[] = []
  for (const id of ids) {
    try {
      const response = await backendClient.get<GenericResponseQuestionDto>({
        url: `/questions/${id}`
      })
      if (response.data) {
        const genericResponse = response.data as GenericResponseQuestionDto
        if (genericResponse.data) {
          questions.push(genericResponse.data)
        }
      }
    } catch (err) {
      console.error(`Failed to fetch question ${id}:`, err)
    }
  }

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-white">
      <div className="p-8 space-y-8 max-w-4xl mx-auto w-full">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">New Session</h1>
            <p className="text-muted-foreground mt-1">
              Review your selected questions before starting
            </p>
          </div>
          <Link href="/questions">
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          </Link>
        </div>

        <div className="grid gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Session Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Questions:</span>
                <span className="font-semibold">{questions.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subjects:</span>
                <span className="font-semibold">
                  {Array.from(new Set(questions.map(q => q.subject))).join(', ')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Exam Types:</span>
                <span className="font-semibold">
                  {Array.from(new Set(questions.map(q => q.examType))).join(', ')}
                </span>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-2">
            <h3 className="font-semibold">Selected Questions:</h3>
            {questions.map((q, i) => (
              <Card key={q.id}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <span className="text-muted-foreground font-mono">{i + 1}.</span>
                    <div className="flex-1">
                      <p className="text-sm line-clamp-2">{q.questionText}</p>
                      <div className="flex gap-2 mt-2">
                        <Badge variant="outline" className="text-xs">
                          {q.subject}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {q.difficulty}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <form action={createSession} className="pt-4">
            <input type="hidden" name="questionIds" value={questionIds} />
            <Button type="submit" size="lg" className="w-full">
              <Play className="mr-2 h-4 w-4" />
              Start Session
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
