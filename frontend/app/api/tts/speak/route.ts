import { NextResponse } from "next/server";
import { generateObject } from "ai";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { z } from "zod";
import {
  synthesizeSpeechWithTimestamps,
  type WordTimestamps,
} from "@/lib/cartesia";

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
    .replace(
      /\\(alpha|beta|gamma|delta|theta|omega|pi|sigma|lambda|mu|epsilon)/g,
      "$1",
    )
    .replace(/\\(sin|cos|tan|log|ln|lim|int|sum)/g, "$1")
    .replace(/\\text\{([^}]*)\}/g, "$1")
    .replace(/[\\{}^_]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const segmentSchema = z.object({
  stepNumber: z.number(),
  stepTitle: z.string().describe("Short title for this solution step"),
  solutionContent: z
    .string()
    .describe(
      "The actual solution content for this step. Written clearly for display. No LaTeX, no markdown.",
    ),
  spokenText: z
    .string()
    .describe(
      "What the tutor says aloud to explain this step. Conversational, natural speech. No LaTeX or formatting.",
    ),
});

const responseSchema = z.object({
  segments: z
    .array(segmentSchema)
    .describe(
      "An ordered list of solution steps. Each step has a title, written solution content, and the spoken explanation.",
    ),
});

function countWords(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}

function mapTimestampsToSegments(
  segments: Array<{ spokenText: string }>,
  wordTimestamps: WordTimestamps,
): Array<{ startTime: number; endTime: number; wordStartIdx: number; wordEndIdx: number }> {
  const result: Array<{
    startTime: number;
    endTime: number;
    wordStartIdx: number;
    wordEndIdx: number;
  }> = [];

  let wordIdx = 0;

  for (const segment of segments) {
    const segWordCount = countWords(segment.spokenText);
    const startIdx = wordIdx;
    const endIdx = Math.min(wordIdx + segWordCount - 1, wordTimestamps.words.length - 1);

    const startTime =
      startIdx < wordTimestamps.start.length
        ? wordTimestamps.start[startIdx]
        : 0;
    const endTime =
      endIdx < wordTimestamps.end.length
        ? wordTimestamps.end[endIdx]
        : wordTimestamps.end[wordTimestamps.end.length - 1] || 0;

    result.push({ startTime, endTime, wordStartIdx: startIdx, wordEndIdx: endIdx });
    wordIdx += segWordCount;
  }

  return result;
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

    const systemPrompt =
      personaPrompt ||
      "You are a brilliant and enthusiastic science tutor. Explain concepts clearly and engagingly.";

    // @ts-ignore
    const { object } = await generateObject({
      model: openrouter("google/gemini-3-flash-preview"),
      schema: responseSchema,
      system: `${systemPrompt}

IMPORTANT RULES:
- You are explaining a question to a student as if speaking to them in person.
- Break your explanation into 3-6 clear solution steps.
- For each step, provide:
  1. A short step title
  2. A written "solutionContent" that shows the solution work (clear text, no LaTeX/markdown)
  3. A "spokenText" that is what you would actually SAY to the student about this step (conversational, natural)
- The spokenText should be natural speech. Write out math in words (e.g. "x squared" not "x^2").
- The solutionContent can use mathematical notation written as text (e.g. "x² + 3x - 5 = 0").
- Keep the total spoken explanation under 400 words.
- Start step 1 by reading/restating the question.`,
      prompt: `Please explain this question step by step:\n\n${cleanQuestion}`,
      temperature: 0.7,
    });

    const segments = object.segments;
    const fullTranscript = segments.map((s: any) => s.spokenText).join(" ");

    const { audioBuffer, wordTimestamps } =
      await synthesizeSpeechWithTimestamps(voiceId, fullTranscript);

    const timingMap = mapTimestampsToSegments(segments, wordTimestamps);

    const enrichedSegments = segments.map((s: any, i: number) => ({
      stepNumber: s.stepNumber,
      stepTitle: s.stepTitle,
      solutionContent: s.solutionContent,
      spokenText: s.spokenText,
      startTime: timingMap[i]?.startTime ?? 0,
      endTime: timingMap[i]?.endTime ?? 0,
      wordStartIdx: timingMap[i]?.wordStartIdx ?? 0,
      wordEndIdx: timingMap[i]?.wordEndIdx ?? 0,
    }));

    const audioBase64 = audioBuffer.toString("base64");

    return NextResponse.json({
      audio: audioBase64,
      segments: enrichedSegments,
      wordTimestamps,
    });
  } catch (error) {
    console.error("Error in TTS speak route:", error);
    const message =
      error instanceof Error ? error.message : "Failed to generate speech";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
