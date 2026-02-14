import { NextResponse } from "next/server";
import { generateObject } from "ai";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { z } from "zod";

console.log("OPENROUTER_API_KEY", process.env.OPENROUTER_API_KEY);

const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
  headers: {
    "HTTP-Referer": "https://github.com/openfermi",
    "X-Title": "OpenFermi Solution Generator",
  },
});

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

const SOLUTION_PROMPT = `You are an expert tutor for competitive exam preparation (JEE Advanced, JEE Mains, NEET).

Given a question, you must provide:

1. **Hints**: A step-by-step sequence of hints that guide a student on HOW TO THINK about solving the problem. Each hint should:
   - Have a clear, short title
   - Contain detailed guidance in LaTeX format
   - Progress from identifying what's given, to key concepts, to the approach
   - NOT give away the full answer, but nudge the student in the right direction

2. **Solution**: One complete, worked-out solution in LaTeX format that:
   - Shows every step of the calculation/reasoning
   - Uses proper LaTeX math notation ($...$ for inline, $$...$$ for display)
   - Arrives at the final answer clearly

Important:
- All mathematical expressions MUST be in LaTeX
- Be thorough but concise
- Use proper physics/chemistry/math notation`;

const BACKEND_URL = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"
).replace(/\/+$/, "");

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { questionId, questionText, latexQuestionText, imageUrls } = body;

    if (!questionId || (!questionText && !latexQuestionText)) {
      return NextResponse.json(
        { error: "questionId and question text are required" },
        { status: 400 },
      );
    }

    const questionContent = latexQuestionText || questionText;

    const content: Array<
      { type: "text"; text: string } | { type: "image"; image: string }
    > = [
      {
        type: "text",
        text: `${SOLUTION_PROMPT}\n\nQuestion:\n${questionContent}`,
      },
    ];

    const urls: string[] = imageUrls || [];
    for (const url of urls) {
      try {
        const imgResponse = await fetch(url);
        const arrayBuffer = await imgResponse.arrayBuffer();
        const base64 = Buffer.from(arrayBuffer).toString("base64");
        const contentType =
          imgResponse.headers.get("content-type") || "image/png";
        content.push({
          type: "image",
          image: `data:${contentType};base64,${base64}`,
        });
      } catch (e) {
        console.error("Failed to fetch question image:", url, e);
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

    const hintsJson = JSON.stringify(object.hints);

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json",
    };
    if (process.env.NEXT_PUBLIC_API_KEY) {
      headers["X-API-KEY"] = process.env.NEXT_PUBLIC_API_KEY;
    }

    const persistResponse = await fetch(`${BACKEND_URL}/solutions`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        questionId,
        hints: hintsJson,
        solution: object.solution,
      }),
    });

    if (!persistResponse.ok) {
      const errorText = await persistResponse.text();
      console.error("Failed to persist solution:", errorText);
      return NextResponse.json(
        { error: "Failed to persist solution", details: errorText },
        { status: 500 },
      );
    }

    const persistedData = await persistResponse.json();

    return NextResponse.json(persistedData);
  } catch (error) {
    console.error("Error generating solution:", error);
    const message =
      error instanceof Error ? error.message : "Failed to generate solution";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
