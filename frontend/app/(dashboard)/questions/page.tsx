import { columns } from "./columns";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { QuestionDto } from "@/lib/backend";
import { AxiosError } from "axios";
import { QuestionController } from "@/lib/backend/sdk.gen";
import { backendClient } from "@/lib/backend-client";

export default async function QuestionsPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const { pageNumber, pageSize } = await searchParams;

  let questions: QuestionDto[] = [];
  let error: string | null = null;

  try {
    const response = await QuestionController.questionRead({
      client: backendClient,
      query: {
        page: pageNumber as string,
        size: pageSize as string,
      },
    });
    questions = response.data?.data || [];
  } catch (err) {
    if (err instanceof AxiosError) {
      error =
        err.response?.data?.message ||
        err.message ||
        "Failed to fetch questions";
    } else {
      error = err instanceof Error ? err.message : "Failed to fetch questions";
    }
  }

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-white">
      <div className="p-8 space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Questions</h1>
            <p className="text-muted-foreground">
              {questions.length > 0
                ? `${questions.length} questions loaded from extracted JSON files`
                : "Manage and browse through your educational questions."}
            </p>
          </div>
          <div className="flex gap-2">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Question
            </Button>
          </div>
        </div>

        {error ? (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-yellow-800">{error}</p>
            <p className="text-sm text-yellow-600 mt-2">No questions found.</p>
          </div>
        ) : questions.length === 0 ? (
          <div className="p-8 text-center border-2 border-dashed rounded-lg">
            <p className="text-muted-foreground mb-2">No questions found</p>
            <p className="text-sm text-muted-foreground">
              Run the extraction script to generate questions from PDFs
            </p>
          </div>
        ) : (
          <DataTable<QuestionDto, string>
            columns={columns}
            data={questions}
            filterColumn="title"
          />
        )}
      </div>
    </div>
  );
}
