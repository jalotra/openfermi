import { columns } from "./columns"
import { DataTable } from "@/components/ui/data-table"
import { mockQuestions } from "@/lib/data"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

export default function QuestionsPage() {
  return (
    <div className="flex-1 flex flex-col min-h-screen bg-white">
      <div className="p-8 space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Questions</h1>
            <p className="text-muted-foreground">
              Manage and browse through your educational questions.
            </p>
          </div>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Question
          </Button>
        </div>
        
        <DataTable 
          columns={columns} 
          data={mockQuestions as any} 
          filterColumn="title"
        />
      </div>
    </div>
  )
}
