"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Play, ListChecks } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { mockQuestions } from "@/lib/data"

export default function SessionsPage() {
  const router = useRouter()
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const toggleQuestion = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const selectAll = () => {
    if (selectedIds.size === mockQuestions.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(mockQuestions.map((q) => q.id)))
    }
  }

  const handleCreateSession = () => {
    const ids = Array.from(selectedIds)
    if (ids.length === 0) return
    const query = ids.length > 1 ? `?ids=${ids.join(",")}` : ""
    router.push(`/sessions/${ids[0]}${query}`)
  }

  const selectedCount = selectedIds.size

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

        {mockQuestions.length === 0 ? (
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
          <>
            <div className="flex items-center justify-between gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={selectAll}
                className="text-muted-foreground"
              >
                {selectedIds.size === mockQuestions.length
                  ? "Deselect all"
                  : "Select all"}
              </Button>
              {selectedCount > 0 && (
                <span className="text-xs text-muted-foreground">
                  {selectedCount} selected
                </span>
              )}
            </div>

            <div className="rounded-lg border border-border bg-card divide-y divide-border overflow-hidden">
              {mockQuestions.map((q) => (
                <label
                  key={q.id}
                  className="flex items-center gap-4 px-4 py-3 cursor-pointer hover:bg-muted/30 transition-colors"
                >
                  <Checkbox
                    checked={selectedIds.has(q.id)}
                    onCheckedChange={() => toggleQuestion(q.id)}
                    aria-label={`Select ${q.title}`}
                  />
                  <span className="flex-1 text-sm font-medium truncate">
                    {q.title}
                  </span>
                  <Badge
                    variant="secondary"
                    className={
                      q.difficulty === "Easy"
                        ? "bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-400"
                        : q.difficulty === "Medium"
                          ? "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400"
                          : "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400"
                    }
                  >
                    {q.difficulty}
                  </Badge>
                </label>
              ))}
            </div>

            <div className="flex justify-end pt-2">
              <Button
                onClick={handleCreateSession}
                disabled={selectedCount === 0}
              >
                <Play className="mr-2 h-4 w-4" />
                Create session
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
