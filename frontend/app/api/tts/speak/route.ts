import { NextResponse } from "next/server";
import { generateText } from "ai";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { synthesizeSpeech } from "@/lib/cartesia";

const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
  headers: {
    "HTTP-Referer": "https://github.com/openfermi",
    "X-Title": "OpenFermi Learn",
  },
});

function stripLatex(text: string): string {
  return text
    .replace(/\$\$(.*?)\$\$/g, "$1")
    .replace(/\$(.*?)\$/g, "$1")
    .replace(/\\frac\{([^}]*)\}\{([^}]*)\}/g, "($1 over $2)")
    .replace(/\\sqrt\{([^}]*)\}/g, "square root of $1")
    .replace(/\\(alpha|beta|gamma|delta|theta|omega|pi|sigma|lambda|mu|epsilon)/g, "$1")
    .replace(/\\(sin|cos|tan|log|ln|lim|int|sum)/g, "$1")
    .replace(/\\text\{([^}]*)\}/g, "$1")
    .replace(/[\\{}^_]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { voiceId, personaPrompt, questionText, latexQuestionText } = body;

    if (!voiceId || (!questionText && !latexQuestionText)) {
      return NextResponse.json(
        { error: "voiceId and question text are required" },
        { status: 400 },
      );
    }

    const cleanQuestion = stripLatex(latexQuestionText || questionText);

    const systemPrompt = personaPrompt ||
      "You are a brilliant and enthusiastic science tutor. Explain concepts clearly and engagingly.";

    // @ts-ignore
    const { text: explanation } = await generateText({
      model: openrouter("google/gemini-3-flash-preview"),
      system: `${systemPrompt}

IMPORTANT RULES FOR YOUR RESPONSE:
- You are explaining this to a student verbally, as if speaking to them in person.
- Do NOT use any LaTeX, markdown, or special formatting.
- Write everything as natural spoken language.
- For math expressions, write them out in words (e.g. "x squared plus 3x minus 5" instead of "x^2 + 3x - 5").
- Keep your explanation clear, engaging, and under 300 words.
- Start by reading the question, then walk through the solution step by step.`,
      prompt: `Please explain this question to the student:\n\n${cleanQuestion}`,
      temperature: 0.7,
    });

    const audioBuffer = await synthesizeSpeech(voiceId, explanation);
    const audioBase64 = audioBuffer.toString("base64");

    return NextResponse.json({
      audio: audioBase64,
      transcript: explanation,
    });
  } catch (error) {
    console.error("Error in TTS speak route:", error);
    const message =
      error instanceof Error ? error.message : "Failed to generate speech";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
