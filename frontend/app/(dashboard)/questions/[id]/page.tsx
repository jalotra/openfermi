import { notFound } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { LatexRenderer } from "@/components/ui/latex-renderer"
import { Play, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { backendClient } from "@/lib/backend-client"
import { GenericResponseQuestionDto } from "@/lib/backend/types.gen"


export default async function QuestionDetailsPage({ params }: { params: { id: string } }) {
  const { id } = await params
  const response = await backendClient.get<GenericResponseQuestionDto>({
    url: `/questions/${id}`
  })
  if ('error' in response && response.error) {
    notFound()
  }
  const question = response.data.data?.data
  
  if (!question) {
    notFound()
  }

  return (
    <div className="flex-1 bg-gray-50/50 p-8 overflow-y-auto">
      <div className="max-w-4xl mx-auto space-y-6">
        <Link href="/questions" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Questions
        </Link>
        
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight">{question.title}</h1>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className={
                question.difficulty === "Easy" ? "bg-green-100 text-green-700" :
                question.difficulty === "Medium" ? "bg-yellow-100 text-yellow-700" :
                "bg-red-100 text-red-700"
              }>
                {question.difficulty}
              </Badge>
              <span className="text-sm text-muted-foreground">ID: {question.id}</span>
            </div>
          </div>
          <Link href={`/canvas/${question.id}`}>
            <Button size="lg" className="shadow-lg shadow-primary/20">
              <Play className="mr-2 h-4 w-4 fill-current" />
              Start Session
            </Button>
          </Link>
        </div>

        <Separator />

        <div className="grid gap-6 md:grid-cols-3">
          <div className="md:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Question Content</CardTitle>
                <CardDescription>The primary problem statement for this question.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-lg leading-relaxed text-gray-800">
                  <LatexRenderer 
                    content={question.latexQuestion || question.question} 
                    displayMode={false}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Options</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4">
                {Object.entries(question.options || {}).map(([key, value]) => {
                  const optionText = question.latexOptions?.[key as 'A' | 'B' | 'C' | 'D'] || (value as string)
                  return (
                    <div key={key} className="flex items-center p-4 rounded-lg border border-gray-100 bg-white shadow-sm">
                      <span className="flex items-center justify-center h-8 w-8 rounded-full bg-primary/10 text-primary font-bold mr-4 shrink-0">
                        {key}
                      </span>
                      <div className="text-gray-700 flex-1">
                        <LatexRenderer content={optionText} displayMode={false} />
                      </div>
                    </div>
                  )
                })}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Metadata</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {question.metadata?.subject && (
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Subject</label>
                    <p className="font-medium">{question.metadata.subject}</p>
                  </div>
                )}
                {question.metadata?.topic && (
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Topic</label>
                    <p className="font-medium">{question.metadata.topic}</p>
                  </div>
                )}
                {question.metadata?.source && (
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Source</label>
                    <p className="font-medium">{question.metadata.source}</p>
                  </div>
                )}
                {question.metadata?.page && (
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Page</label>
                    <p className="font-medium">{question.metadata.page}</p>
                  </div>
                )}
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Created</label>
                  <p className="font-medium">Jan 24, 2026</p>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Last Modified</label>
                  <p className="font-medium">2 hours ago</p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-primary/5 border-primary/10">
              <CardHeader>
                <CardTitle className="text-sm">Quick Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Attempts</span>
                  <span className="font-bold">124</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Avg. Accuracy</span>
                  <span className="font-bold text-green-600">68%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Avg. Time</span>
                  <span className="font-bold">4:20m</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
