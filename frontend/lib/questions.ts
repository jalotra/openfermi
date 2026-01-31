/**
 * Client-side utility functions for fetching questions
 * These functions use fetch API to call the backend directly
 */

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

interface GenericResponse<T> {
  data: T;
  message: string;
}

interface QuestionDto {
  id: string;
  questionText: string;
  subject: string;
  examType: string;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  options: string[];
  correctAnswer?: string;
  explanation?: string;
  imageUrls?: string[];
  year?: number;
  paperNumber?: number;
  questionNumber?: number;
  tags?: string[];
  topic?: string;
  marks?: number;
  negativeMarks?: number;
  isActive?: boolean;
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
    id: dto.id,
    title:
      dto.questionText.substring(0, 100) +
      (dto.questionText.length > 100 ? "..." : ""),
    question: dto.questionText,
    latexQuestion: dto.questionText, // Assuming same for now
    difficulty: difficultyMap[dto.difficulty] || "Medium",
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
 * Get backend API URL from environment or default to localhost:8080
 */
function getBackendUrl(): string {
  if (typeof window !== "undefined") {
    // Client-side: use NEXT_PUBLIC_API_URL
    return process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
  }
  // Server-side: use NEXT_PUBLIC_API_URL or default
  return process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
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
  const baseUrl = getBackendUrl();
  const params = new URLSearchParams();
  // Backend supports page and size params, but we'll fetch all for now
  // if (source) params.append('source', source)
  // if (year) params.append('year', year)

  const response = await fetch(`${baseUrl}/questions?${params.toString()}`);
  if (!response.ok) {
    throw new Error("Failed to fetch questions");
  }

  const genericResponse: GenericResponse<QuestionDto[]> = await response.json();

  if (!genericResponse.data) {
    return { questions: [], sources: [], total: 0 };
  }

  const questions = genericResponse.data.map(mapQuestionDtoToQuestion);
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
  const baseUrl = getBackendUrl();
  const response = await fetch(`${baseUrl}/questions/${id}`);
  if (!response.ok) {
    return null;
  }

  const genericResponse: GenericResponse<QuestionDto> = await response.json();

  if (!genericResponse.data) {
    return null;
  }

  return mapQuestionDtoToQuestion(genericResponse.data);
}
