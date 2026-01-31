import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

interface QuestionFile {
  metadata: {
    extractedAt: string
    totalQuestions: number
    source: string
  }
  questions: Array<{
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
    metadata: {
      source: string
      page: number
      questionNumber: number
      subject?: string
      topic?: string
      isMultiPart: boolean
    }
  }>
}

/**
 * GET /api/questions
 * Returns all questions from JSON files in scripts/output directory
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const source = searchParams.get('source')
    const year = searchParams.get('year') || new Date().getFullYear().toString()

    // Path to scripts/output directory (relative to project root)
    const scriptsDir = path.join(process.cwd(), '..', 'scripts')
    const outputDir = path.join(scriptsDir, 'output', year)

    // Check if output directory exists
    if (!fs.existsSync(outputDir)) {
      return NextResponse.json({ 
        questions: [],
        sources: [],
        message: 'No questions found. Run the extraction script first.' 
      })
    }

    // Find all JSON files in the output directory
    const files = fs.readdirSync(outputDir)
      .filter(file => file.endsWith('.json'))
      .sort()
      .reverse() // Most recent first

    const allQuestions: QuestionFile['questions'] = []
    const sources = new Set<string>()

    for (const file of files) {
      try {
        const filePath = path.join(outputDir, file)
        const fileContent = fs.readFileSync(filePath, 'utf-8')
        const data: QuestionFile = JSON.parse(fileContent)

        // Filter by source if specified
        if (source && data.metadata.source !== source) {
          continue
        }

        sources.add(data.metadata.source)
        allQuestions.push(...data.questions)
      } catch (error) {
        console.error(`Error reading ${file}:`, error)
        // Continue with other files
      }
    }

    return NextResponse.json({
      questions: allQuestions,
      sources: Array.from(sources),
      total: allQuestions.length
    })
  } catch (error: any) {
    console.error('Error loading questions:', error)
    return NextResponse.json(
      { error: 'Failed to load questions', message: error.message },
      { status: 500 }
    )
  }
}
