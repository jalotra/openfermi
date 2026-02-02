import { AxiosError } from "axios";
import { backendClient } from "@/lib/backend-client";
import { QuestionController } from "@/lib/backend/sdk.gen";
import type { QuestionDto } from "@/lib/backend/types.gen";

export interface Question {
  id: string;
  title: string;
  question: string;
  latexQuestion?: string;
  difficulty: "Easy" | "Medium" | "Hard";
  options: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  latexOptions?: {
    A?: string;
    B?: string;
    C?: string;
    D?: string;
  };
  images?: Array<{
    format: string;
    filename?: string;
    path?: string;
  }>;
  metadata?: {
    source: string;
    page: number;
    questionNumber: number;
    subject?: string;
    topic?: string;
    isMultiPart: boolean;
  };
}

// Map backend QuestionDto to frontend Question format
function mapQuestionDtoToQuestion(dto: QuestionDto): Question {
  // Convert options array to object format { A: ..., B: ..., C: ..., D: ... }
  const optionsObj: Record<string, string> = {};
  dto.options?.forEach((opt, index) => {
    const key = String.fromCharCode(65 + index); // A, B, C, D
    optionsObj[key] = opt;
  });

  // Convert difficulty from EASY/MEDIUM/HARD to Easy/Medium/Hard
  const difficultyMap: Record<string, "Easy" | "Medium" | "Hard"> = {
    EASY: "Easy",
    MEDIUM: "Medium",
    HARD: "Hard",
  };

  return {
    id: dto.id || "",
    title:
      (dto.questionText || "").substring(0, 100) +
      ((dto.questionText || "").length > 100 ? "..." : ""),
    question: dto.questionText || "",
    latexQuestion: dto.latexQuestionText || dto.questionText || "",
    difficulty: difficultyMap[dto.difficulty || "MEDIUM"] || "Medium",
    options: {
      A: optionsObj["A"] || "",
      B: optionsObj["B"] || "",
      C: optionsObj["C"] || "",
      D: optionsObj["D"] || "",
    },
    latexOptions: {
      A: optionsObj["A"],
      B: optionsObj["B"],
      C: optionsObj["C"],
      D: optionsObj["D"],
    },
    images: dto.imageUrls?.map((url) => ({ format: "png", path: url })) || [],
    metadata: {
      source: dto.examType || "",
      page: dto.paperNumber || 0,
      questionNumber: dto.questionNumber || 0,
      subject: dto.subject,
      topic: dto.topic,
      isMultiPart: false,
    },
  };
}

/**
 * Fetch all questions from the backend API
 */
export async function fetchQuestions(
  source?: string,
  year?: string,
): Promise<{
  questions: Question[];
  sources: string[];
  total: number;
}> {
  void source;
  void year;

  const response = await QuestionController.questionRead({
    client: backendClient,
  });

  const dtos = response.data?.data || [];
  const questions = dtos.map(mapQuestionDtoToQuestion);
  const sources = Array.from(
    new Set(questions.map((q) => q.metadata?.source).filter(Boolean)),
  ) as string[];

  return {
    questions,
    sources,
    total: questions.length,
  };
}

/**
 * Fetch a single question by ID from the backend API
 */
export async function fetchQuestion(id: string): Promise<Question | null> {
  try {
    const response = await QuestionController.questionGet({
      client: backendClient,
      path: { id },
    });

    const dto = response.data?.data;
    if (!dto) return null;

    return mapQuestionDtoToQuestion(dto);
  } catch (err) {
    if (err instanceof AxiosError && err.response?.status === 404) {
      return null;
    }
    throw err;
  }
}
