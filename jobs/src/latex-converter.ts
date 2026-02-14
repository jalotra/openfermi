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
});

export interface LaTeXQuestion {
  questionText: string;
  latexQuestion: string;
  options: Array<{ label: string; text: string; latexText: string }>;
}

const LATEX_CONVERSION_PROMPT = (question: ExtractedQuestion) => {
  const optionsText = question.options.map(opt => `${opt.label}. ${opt.text}`).join('\n');

  return `You are an expert at converting mathematical exam questions from images into LaTeX format. You will be given an image of a JEE (Joint Entrance Examination) question and its OCR-extracted text for structural reference.

The image is the **source of truth** for all equations, symbols, and notation — use the provided text only for structural guidance (question number, option labels, part labels).

## LaTeX Formatting Rules

### Math Delimiters
- Use \`$...$\` for inline math (variables, short expressions within a sentence).
- Use \`$$...$$\` for display math (standalone equations, long expressions that should be centered on their own line).
- The output is rendered by **KaTeX**, so only use KaTeX-supported commands.

### What to Convert
- Fractions: \`\\frac{a}{b}\`
- Superscripts/subscripts: \`x^{2}\`, \`a_{n}\`
- Greek letters: \`\\alpha\`, \`\\beta\`, \`\\theta\`, \`\\omega\`, etc.
- Integrals: \`\\int_{a}^{b} f(x)\\,dx\`
- Summations: \`\\sum_{i=1}^{n} a_i\`
- Limits: \`\\lim_{x \\to 0}\`
- Square roots: \`\\sqrt{x}\`, \`\\sqrt[n]{x}\`
- Vectors: \`\\vec{v}\`, \`\\hat{n}\`
- Matrices: \`\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}\`
- Trigonometric functions: \`\\sin\`, \`\\cos\`, \`\\tan\`, \`\\log\`, \`\\ln\`
- Absolute values: \`|x|\` or \`\\left| x \\right|\`
- Binomial coefficients: \`\\binom{n}{k}\`
- Set notation: \`\\in\`, \`\\subset\`, \`\\cup\`, \`\\cap\`, \`\\emptyset\`
- Arrows: \`\\to\`, \`\\rightarrow\`, \`\\Rightarrow\`, \`\\implies\`
- Inequalities: \`\\leq\`, \`\\geq\`, \`\\neq\`
- Infinity: \`\\infty\`
- Dots: \`\\cdots\`, \`\\ldots\`, \`\\vdots\`

### Text Within Math
- Use \`\\text{...}\` for words inside math mode: \`$x \\text{ is even}$\`
- Use \`\\textbf{...}\` for bold text, \`\\textit{...}\` for italics outside math mode.

### Units
- Always wrap units in \`\\text{...}\`: \`$10\\,\\text{m/s}$\`, \`$5\\,\\text{kg}$\`
- Use \`\\,\` for a thin space before units.

### Chemical Notation
- Use \`\\rightarrow\` for reaction arrows.
- Use subscripts for molecular formulas: \`$H_2O$\`, \`$CO_2$\`.

### Formatting Principles
- Preserve the exact mathematical meaning from the image. Do not simplify or alter expressions.
- Keep plain-text portions (non-math sentences) outside of \`$...$\` delimiters.
- Each option's LaTeX text should be self-contained and renderable on its own.
- Do NOT include the option label (A, B, C, D) inside the option's LaTeX text — labels are handled separately.
- Do NOT include the question number in the question's LaTeX text.
- If a question references a diagram/figure in the image, mention it as "as shown in the figure" — the image will be displayed alongside the rendered LaTeX.
- Use \`\\,\` for thin spaces before \`dx\` in integrals: \`\\int f(x)\\,dx\`.

### Common Pitfalls to Avoid
- Do NOT use \`\\[...\\]\` — use \`$$...$$\` instead (KaTeX compatibility).
- Do NOT use \`\\begin{equation}\`, \`\\begin{align}\`, or other LaTeX-only environments.
- Do NOT leave math delimiters unbalanced.
- Do NOT wrap entire plain-text sentences in \`$...$\`.
- Escape special characters in text mode: \`\\%\`, \`\\&\`, \`\\#\`.

Now convert the following question from the provided image.

Question Number: ${question.questionNumber}
Question Text: ${question.questionText}

Options:
${optionsText}`;
};

function createFallbackLaTeX(question: ExtractedQuestion): LaTeXQuestion {
  return {
    questionText: question.questionText,
    latexQuestion: question.questionText,
    options: question.options.map(opt => ({
      label: opt.label,
      text: opt.text,
      latexText: opt.text,
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
