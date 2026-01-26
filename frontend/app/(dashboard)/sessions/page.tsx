import { ListChecks } from "lucide-react"
import { backendClient } from "@/lib/backend-client"


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
