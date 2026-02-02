import { generateObject } from 'ai';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { z } from 'zod';
import fs from 'fs';
import { ExtractedQuestion } from './question-extractor.js';

const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
  headers: {
    'HTTP-Referer': 'https://github.com/openfermi',
    'X-Title': 'OpenFermi LaTeX Converter',
  },
});

const latexConversionSchema = z.object({
  latexQuestion: z.string().describe('The question text converted to LaTeX format with proper mathematical notation'),
  latexOptions: z.array(z.object({
    label: z.string().describe('Option label (A, B, C, D)'),
    latexText: z.string().describe('Option text in LaTeX format'),
  })).describe('Answer options converted to LaTeX format'),
  latexParts: z.array(z.object({
    partLabel: z.string(),
    latexText: z.string(),
  })).optional().describe('Multi-part question parts in LaTeX format if applicable'),
});

export interface LaTeXQuestion {
  questionText: string;
  latexQuestion: string;
  options: Array<{ label: string; text: string; latexText: string }>;
  parts?: Array<{ partLabel: string; partText: string; latexText: string }>;
}

const LATEX_CONVERSION_PROMPT = (question: ExtractedQuestion) => `You are an expert at converting mathematical text to LaTeX format. 

Convert the following JEE question to LaTeX format. Preserve all mathematical notation, equations, symbols, and formatting.
Use the provided image as the source of truth for equations and symbols; use the provided text mainly for structure.

Instructions:
1. Convert all mathematical expressions to proper LaTeX syntax
2. Use appropriate LaTeX environments: $...$ for inline math, $$...$$ or \\[...\\] for display math
3. Preserve text formatting (bold, italics) using LaTeX commands
4. Convert fractions, integrals, summations, limits, matrices, etc. to proper LaTeX
5. Keep the question structure intact
6. Convert all answer options to LaTeX as well
${question.isMultiPart ? '7. Convert all parts of the multi-part question to LaTeX' : ''}

Question Number: ${question.questionNumber}
Question Text: ${question.questionText}

Options:
${question.options.map(opt => `${opt.label}. ${opt.text}`).join('\n')}

${question.isMultiPart && question.parts ? `\nMulti-part question parts:\n${question.parts.map(p => `${p.partLabel}. ${p.partText}`).join('\n')}` : ''}

Please provide the LaTeX version of this question and all its components.`;

function createFallbackLaTeX(question: ExtractedQuestion): LaTeXQuestion {
  return {
    questionText: question.questionText,
    latexQuestion: question.questionText,
    options: question.options.map(opt => ({
      label: opt.label,
      text: opt.text,
      latexText: opt.text,
    })),
    parts: question.parts?.map(part => ({
      partLabel: part.partLabel,
      partText: part.partText,
      latexText: part.partText,
    })),
  };
}

function isApiError(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) return false;
  const message = 'message' in error ? String(error.message) : String(error);
  return message.includes('API') || message.includes('401') || message.includes('auth');
}

export async function convertQuestionToLaTeX(
  question: ExtractedQuestion,
  model: string = 'google/gemini-3-flash-preview'
): Promise<LaTeXQuestion> {
  const content: Array<{ type: 'text' | 'image'; text?: string; image?: string }> = [
    {
      type: 'text',
      text: LATEX_CONVERSION_PROMPT(question),
    },
  ];

  const imagePath = question.questionImagePath || question.pageImagePath;
  if (imagePath && fs.existsSync(imagePath)) {
    const imageBuffer = fs.readFileSync(imagePath);
    const base64 = imageBuffer.toString('base64');
    content.push({
      type: 'image',
      image: `data:image/png;base64,${base64}`,
    });
  }

  try {
    // @ts-ignore - Type instantiation depth issue with AI SDK
    const { object } = await generateObject({
      model: openrouter(model),
      schema: latexConversionSchema,
      messages: [
        {
          role: 'user' as const,
          content: content as any,
        },
      ] as any,
      temperature: 0.1,
    });

    return {
      questionText: question.questionText,
      latexQuestion: object.latexQuestion,
      options: question.options.map((opt, idx) => ({
        label: opt.label,
        text: opt.text,
        latexText: object.latexOptions[idx]?.latexText || opt.text,
      })),
      parts: question.parts && object.latexParts
        ? question.parts.map((part, idx) => ({
            partLabel: part.partLabel,
            partText: part.partText,
            latexText: object.latexParts?.[idx]?.latexText || part.partText,
          }))
        : undefined,
    };
  } catch (error) {
    console.error(`Error converting question ${question.questionNumber} to LaTeX:`, error);
    return createFallbackLaTeX(question);
  }
}

export async function convertQuestionsToLaTeX(
  questions: ExtractedQuestion[],
  model?: string
): Promise<LaTeXQuestion[]> {
  const latexQuestions: LaTeXQuestion[] = [];
  
  console.log(` Converting ${questions.length} questions to LaTeX...`);
  
  for (let i = 0; i < questions.length; i++) {
    const question = questions[i];
    try {
      process.stdout.write(`  Question ${question.questionNumber} (${i + 1}/${questions.length})... `);
      const latexQ = await convertQuestionToLaTeX(question, model);
      latexQuestions.push(latexQ);
      console.log(`✓`);
    } catch (error) {
      if (isApiError(error)) {
        console.log(`✗ API error - check your OPENROUTER_API_KEY`);
        throw error;
      }
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.log(`✗ Error: ${errorMsg.substring(0, 50)}...`);
      latexQuestions.push(createFallbackLaTeX(question));
    }
  }
  
  return latexQuestions;
}
