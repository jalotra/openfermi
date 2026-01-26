import { ListChecks } from "lucide-react"
import { backendClient } from "@/lib/backend-client"

interface GenericResponse<T> {
  data: T
  message: string
}

interface QuestionDto {
  id: string
  questionText: string
  subject: string
  examType: string
  difficulty: 'EASY' | 'MEDIUM' | 'HARD'
  options: string[]
  correctAnswer?: string
  explanation?: string
  imageUrls?: string[]
  year?: number
  paperNumber?: number
  questionNumber?: number
  tags?: string[]
  topic?: string
  marks?: number
  negativeMarks?: number
  isActive?: boolean
}

// Map backend QuestionDto to frontend Question format for sessions page
function mapQuestionDtoToQuestion(dto: QuestionDto) {
  // Convert difficulty from EASY/MEDIUM/HARD to Easy/Medium/Hard
  const difficultyMap: Record<string, "Easy" | "Medium" | "Hard"> = {
    'EASY': 'Easy',
    'MEDIUM': 'Medium',
    'HARD': 'Hard'
  }

  return {
    id: dto.id,
    title: dto.questionText.substring(0, 100) + (dto.questionText.length > 100 ? '...' : ''),
    difficulty: difficultyMap[dto.difficulty] || 'Medium'
  }
}

async function getQuestions() {
  try {
    const response = await backendClient.get<GenericResponse<QuestionDto[]>>({
      url: '/questions',
      query: {
        // Optional pagination params
      }
    })

    if (response.error) {
      console.error('Backend API error:', response.error)
      return []
    }

    if (response.data) {
      const genericResponse = response.data as GenericResponse<QuestionDto[]>
      if (genericResponse.data) {
        return genericResponse.data.map(mapQuestionDtoToQuestion)
      }
    }
    return []
  } catch (err) {
    console.error('Error fetching questions:', err)
    return []
  }
}

export default async function SessionsPage() {
  const questions = await getQuestions()

  return (
    <div className="flex flex-1 flex-col min-h-0 bg-background">
      <div className="p-8 space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            New session
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Select the questions you want to practice, then start your session.
          </p>
        </div>

        {questions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 rounded-lg border border-dashed border-muted-foreground/25 bg-muted/20">
            <ListChecks className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <p className="text-sm font-medium text-foreground">
              No questions available
            </p>
            <p className="text-xs text-muted-foreground mt-1 text-center max-w-sm">
              Add questions from the Questions page first, then come back to
              create a session.
            </p>
          </div>
        ) : (
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Sessions
            </h1>
          </div>
        )
        }
      </div>
    </div>
  )
}
