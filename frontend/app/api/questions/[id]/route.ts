import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

/**
 * GET /api/questions/[id]
 * Returns a specific question by ID
 */
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const questionId = params.id

    // Path to scripts/output directory
    const scriptsDir = path.join(process.cwd(), '..', 'scripts')
    const outputDir = path.join(scriptsDir, 'output')

    // Search through all year directories
    const years = fs.existsSync(outputDir) 
      ? fs.readdirSync(outputDir).filter(dir => 
          fs.statSync(path.join(outputDir, dir)).isDirectory()
        )
      : []

    for (const year of years) {
      const yearDir = path.join(outputDir, year)
      const files = fs.readdirSync(yearDir)
        .filter(file => file.endsWith('.json'))

      for (const file of files) {
        try {
          const filePath = path.join(yearDir, file)
          const fileContent = fs.readFileSync(filePath, 'utf-8')
          const data = JSON.parse(fileContent)

          const question = data.questions?.find((q: any) => q.id === questionId)
          if (question) {
            return NextResponse.json(question)
          }
        } catch (error) {
          console.error(`Error reading ${file}:`, error)
          continue
        }
      }
    }

    return NextResponse.json(
      { error: 'Question not found' },
      { status: 404 }
    )
  } catch (error: any) {
    console.error('Error loading question:', error)
    return NextResponse.json(
      { error: 'Failed to load question', message: error.message },
      { status: 500 }
    )
  }
}
