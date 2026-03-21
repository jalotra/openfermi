import { NextResponse } from "next/server";

const LATEX_AGENT_URL = process.env.LATEX_AGENT_URL;

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

    if (!LATEX_AGENT_URL) {
      return NextResponse.json(
        { error: "LATEX_AGENT_URL is not configured" },
        { status: 500 },
      );
    }

    const agentResponse = await fetch(
      `${LATEX_AGENT_URL}/agents/latex-solver-agent/${questionId}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionId,
          questionText,
          latexQuestionText,
          imageUrls,
        }),
      },
    );

    if (!agentResponse.ok) {
      const errorText = await agentResponse.text();
      console.error("Agent error:", errorText);
      return NextResponse.json(
        { error: "Agent failed to generate solution", details: errorText },
        { status: agentResponse.status },
      );
    }

    const data = await agentResponse.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error generating solution:", error);
    const message =
      error instanceof Error ? error.message : "Failed to generate solution";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
