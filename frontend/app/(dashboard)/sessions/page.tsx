import { columns } from "./columns"
import { DataTable } from "@/components/ui/data-table"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { backendClient } from "@/lib/backend-client"
import { GenericResponseListSessionDto, SessionDto } from "@/lib/backend/types.gen"
import Link from "next/link"

export default async function SessionsPage() {
  let sessions: SessionDto[] = []
  let error: string | null = null

  try {
    const response = await backendClient.get<GenericResponseListSessionDto>({
      url: '/sessions',
    })
    
    if (response.data) {
      const genericResponse = response.data as GenericResponseListSessionDto
      if (genericResponse.data) {
        sessions = genericResponse.data
      }
    }
  } catch (err) {
    error = err instanceof Error ? err.message : 'Failed to fetch sessions'
  }

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-white">
      <div className="p-8 space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Sessions</h1>
            <p className="text-muted-foreground">
              {sessions.length > 0 
                ? `You have ${sessions.length} practice sessions`
                : 'Create a session to start practicing questions.'}
            </p>
          </div>
          <Link href="/questions">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Session
            </Button>
          </Link>
        </div>

        {error ? (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800">{error}</p>
          </div>
        ) : sessions.length === 0 ? (
          <div className="p-8 text-center border-2 border-dashed rounded-lg">
            <p className="text-muted-foreground mb-2">No sessions yet</p>
            <p className="text-sm text-muted-foreground">
              Go to Questions and select questions to create a practice session
            </p>
          </div>
        ) : (
          <DataTable<SessionDto, string> 
            columns={columns} 
            data={sessions} 
            filterColumn="status"
          />
        )}
      </div>
    </div>
  )
}
