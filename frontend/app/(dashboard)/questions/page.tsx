import { columns } from "./columns"
import { DataTable } from "@/components/ui/data-table"
import { Button } from "@/components/ui/button"
import { Plus, RefreshCw } from "lucide-react"
import { QuestionsClient } from "./questions-client"

async function getQuestions() {
  try {
    // Use absolute URL for server-side fetch
    const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http'
    const host = process.env.VERCEL_URL || 'localhost:3000'
    const baseUrl = `${protocol}://${host}`
    
    const response = await fetch(`${baseUrl}/api/questions`, {
      cache: 'no-store' // Always fetch fresh data
    })
    
    if (response.ok) {
      return await response.json()
    }
    return { questions: [], sources: [] }
  } catch (err) {
    console.error('Error fetching questions:', err)
    return { questions: [], sources: [], error: 'Failed to connect to API' }
  }
}

export default async function QuestionsPage() {
  // Fetch questions from API
  const { questions = [], sources = [], error = null } = await getQuestions()

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-white">
      <div className="p-8 space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Questions</h1>
            <p className="text-muted-foreground">
              {questions.length > 0 
                ? `${questions.length} questions loaded from extracted JSON files`
                : 'Manage and browse through your educational questions.'}
            </p>
            {sources.length > 0 && (
              <p className="text-sm text-muted-foreground mt-1">
                Sources: {sources.join(', ')}
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <QuestionsClient />
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Question
            </Button>
          </div>
        </div>

        {error ? (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-yellow-800">{error}</p>
            <p className="text-sm text-yellow-600 mt-2">
              Make sure you've run the extraction script: <code className="bg-yellow-100 px-1 rounded">npm run extract</code> in the scripts directory
            </p>
          </div>
        ) : questions.length === 0 ? (
          <div className="p-8 text-center border-2 border-dashed rounded-lg">
            <p className="text-muted-foreground mb-2">No questions found</p>
            <p className="text-sm text-muted-foreground">
              Run the extraction script to generate questions from PDFs
            </p>
          </div>
        ) : (
          <DataTable 
            columns={columns} 
            data={questions as any} 
            filterColumn="title"
          />
        )}
      </div>
    </div>
  )
}
