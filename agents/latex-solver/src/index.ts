import { Agent, routeAgentRequest } from "agents";
import { generateObject } from "ai";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { z } from "zod";
import { compileLatex } from "./latex-compiler";
import { SOLUTION_PROMPT, LATEX_PROMPT, buildRetryPrompt } from "./prompts";

const MAX_RETRIES = 3;

interface Env {
  OPENROUTER_API_KEY: string;
  LATEX_HTTP_URL: string;
  BACKEND_URL: string;
  BACKEND_API_KEY: string;
  LatexSolverAgent: DurableObjectNamespace;
}

interface SolveRequest {
  questionId: string;
  questionText: string;
  latexQuestionText?: string;
  imageUrls?: string[];
}

const hintStepSchema = z.object({
  stepNumber: z.number().describe("The step number in the hint sequence"),
  title: z
    .string()
    .describe("Short title for this hint step, e.g. 'Identify the forces'"),
  content: z
    .string()
    .describe(
      "Detailed hint content in LaTeX format. Use $...$ for inline math and $$...$$ for display math.",
    ),
});

const solutionResponseSchema = z.object({
  hints: z
    .array(hintStepSchema)
    .describe(
      "Step-by-step hints on how to think about solving this problem. Each step should guide the student through the reasoning process without giving away the full answer.",
    ),
  solution: z
    .string()
    .describe(
      "One complete way to solve the question, in LaTeX format. Use $...$ for inline math and $$...$$ for display math. Show all working steps clearly.",
    ),
});

type SolutionResponse = z.infer<typeof solutionResponseSchema>;

async function fetchImageAsBase64(
  url: string,
): Promise<{ base64: string; contentType: string } | null> {
  try {
    const res = await fetch(url);
    const buffer = await res.arrayBuffer();
    const base64 = btoa(
      new Uint8Array(buffer).reduce(
        (data, byte) => data + String.fromCharCode(byte),
        "",
      ),
    );
    const contentType = res.headers.get("content-type") || "image/png";
    return { base64, contentType };
  } catch (e) {
    console.error("Failed to fetch image:", url, e);
    return null;
  }
}

async function generateLatex(
  questionContent: string,
  imageUrls: string[],
  compilationLogs: string,
  env: Env,
): Promise<SolutionResponse> {
  const openrouter = createOpenRouter({
    apiKey: env.OPENROUTER_API_KEY,
    headers: {
      "HTTP-Referer": "https://github.com/Tars",
      "X-Title": "Tars Solution Generator",
    },
  });

  let promptText = `${SOLUTION_PROMPT}\n\nQuestion:\n${questionContent}\n\n${LATEX_PROMPT}`;
  if (compilationLogs) {
    promptText += `\n\n${buildRetryPrompt(compilationLogs)}`;
  }

  const content: Array<
    { type: "text"; text: string } | { type: "image"; image: string }
  > = [{ type: "text", text: promptText }];

  for (const url of imageUrls) {
    const img = await fetchImageAsBase64(url);
    if (img) {
      content.push({
        type: "image",
        image: `data:${img.contentType};base64,${img.base64}`,
      });
    }
  }

  // @ts-ignore - Type instantiation depth issue with AI SDK
  const { object } = await generateObject({
    model: openrouter("google/gemini-3-flash-preview"),
    schema: solutionResponseSchema,
    messages: [
      {
        role: "user" as const,
        content: content as any,
      },
    ] as any,
    temperature: 0.2,
  });

  return object as SolutionResponse;
}

async function solveWithLatex(
  questionContent: string,
  imageUrls: string[],
  env: Env,
): Promise<{
  hints: SolutionResponse["hints"];
  solution: string;
  validated: boolean;
  lastError?: string;
}> {
  let lastResult: SolutionResponse | null = null;
  let compilationLogs = "";

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    console.log(
      `LaTeX generation attempt ${attempt + 1}/${MAX_RETRIES}`,
    );

    lastResult = await generateLatex(
      questionContent,
      imageUrls,
      compilationLogs,
      env,
    );

    const compileResult = await compileLatex(
      lastResult.solution,
      env.LATEX_HTTP_URL,
    );

    if (compileResult.success) {
      console.log(`LaTeX compiled successfully on attempt ${attempt + 1}`);
      return {
        hints: lastResult.hints,
        solution: lastResult.solution,
        validated: true,
      };
    }

    compilationLogs = compileResult.logs || "Unknown compilation error";
    console.warn(
      `LaTeX compilation failed on attempt ${attempt + 1}:`,
      compilationLogs.slice(0, 200),
    );
  }

  console.warn("Max retries reached, returning best-effort solution");
  return {
    hints: lastResult!.hints,
    solution: lastResult!.solution,
    validated: false,
    lastError: compilationLogs,
  };
}

async function persistSolution(
  questionId: string,
  hints: SolutionResponse["hints"],
  solution: string,
  env: Env,
): Promise<any> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };
  if (env.BACKEND_API_KEY) {
    headers["X-API-KEY"] = env.BACKEND_API_KEY;
  }

  const backendUrl = env.BACKEND_URL.replace(/\/+$/, "");
  const res = await fetch(`${backendUrl}/solutions`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      questionId,
      hints: JSON.stringify(hints),
      solution,
    }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to persist solution: ${errorText}`);
  }

  return res.json();
}

export class LatexSolverAgent extends Agent<Env, {}> {
  async onRequest(request: Request): Promise<Response> {
    if (request.method !== "POST") {
      return new Response("Method not allowed", { status: 405 });
    }

    try {
      const body = (await request.json()) as SolveRequest;
      const { questionId, questionText, latexQuestionText, imageUrls } = body;

      if (!questionId || (!questionText && !latexQuestionText)) {
        return Response.json(
          { error: "questionId and question text are required" },
          { status: 400 },
        );
      }

      const questionContent = latexQuestionText || questionText;
      const urls = imageUrls || [];

      const result = await solveWithLatex(questionContent, urls, this.env);

      const persisted = await persistSolution(
        questionId,
        result.hints,
        result.solution,
        this.env,
      );

      return Response.json({
        ...persisted,
        validated: result.validated,
        ...(result.lastError && { compilationWarning: result.lastError }),
      });
    } catch (error) {
      console.error("Error in LatexSolverAgent:", error);
      const message =
        error instanceof Error
          ? error.message
          : "Failed to generate solution";
      return Response.json({ error: message }, { status: 500 });
    }
  }
}

export default {
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext,
  ): Promise<Response> {
    const response = await routeAgentRequest(request, env, { cors: true });
    if (response) {
      return response;
    }

    const url = new URL(request.url);
    if (url.pathname === "/health") {
      return Response.json({ status: "ok" });
    }

    return new Response("Not found", { status: 404 });
  },
} satisfies ExportedHandler<Env>;
