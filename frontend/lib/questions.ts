/**
 * Client-side utility functions for fetching questions
 */

export interface Question {
  id: string
  title: string
  question: string
  latexQuestion?: string
  difficulty: 'Easy' | 'Medium' | 'Hard'
  options: {
    A: string
    B: string
    C: string
    D: string
  }
  latexOptions?: {
    A?: string
    B?: string
    C?: string
    D?: string
  }
  images?: Array<{
    format: string
    filename?: string
    path?: string
  }>
  metadata?: {
    source: string
    page: number
    questionNumber: number
    subject?: string
    topic?: string
    isMultiPart: boolean
  }
}

/**
 * Fetch all questions from the API
 */
export async function fetchQuestions(source?: string, year?: string): Promise<{
  questions: Question[]
  sources: string[]
  total: number
}> {
  const params = new URLSearchParams()
  if (source) params.append('source', source)
  if (year) params.append('year', year)

  const response = await fetch(`/api/questions?${params.toString()}`)
  if (!response.ok) {
    throw new Error('Failed to fetch questions')
  }
  return response.json()
}

/**
 * Fetch a single question by ID
 */
export async function fetchQuestion(id: string): Promise<Question | null> {
  const response = await fetch(`/api/questions/${id}`)
  if (!response.ok) {
    return null
  }
  return response.json()
}
