import { generateObject } from 'ai';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { z } from 'zod';
import { PageImage } from './image-processor.js';

const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
  headers: {
    'HTTP-Referer': 'https://github.com/openfermi',
    'X-Title': 'OpenFermi Question Extractor',
  },
});

const optionSchema = z.object({
  label: z.string().describe('The option label (A, B, C, D, etc.)'),
  text: z.string().describe('The option text content'),
});

const bboxSchema = z.object({
  left: z.number().describe('Normalized left coordinate (0 to 1)'),
  top: z.number().describe('Normalized top coordinate (0 to 1)'),
  right: z.number().describe('Normalized right coordinate (0 to 1)'),
  bottom: z.number().describe('Normalized bottom coordinate (0 to 1)'),
});

const questionSchema = z.object({
  questionNumber: z.number().describe('The question number as it appears in the paper'),
  questionText: z.string().describe('The main question text/stem'),
  options: z.array(optionSchema).describe('Array of answer options (typically A, B, C, D)'),
  hasImages: z.boolean().describe('Whether this question contains diagrams or images'),
  imageIndices: z.array(z.number()).optional().describe('Indices of images from the page that belong to this question'),
  questionBbox: bboxSchema.optional().describe('Normalized bounding box covering the entire question region on the page'),
  subject: z.string().optional().describe('Subject area if identifiable (e.g., Mathematics, Physics, Chemistry)'),
  topic: z.string().optional().describe('Topic or chapter if identifiable'),
});

const extractionSchema = z.object({
  questions: z.array(questionSchema).describe('Array of extracted questions from the page'),
});

export interface ExtractedQuestion {
  questionNumber: number;
  questionText: string;
  options: Array<{ label: string; text: string }>;
  hasImages: boolean;
  imageIndices?: number[];
  images?: never;
  questionBbox?: NormalizedBBox;
  subject?: string;
  topic?: string;
  pageNumber: number;
  pageImagePath?: string;
  questionImagePath?: string;
}

export interface NormalizedBBox {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

const EXTRACTION_PROMPT = (pageNumber: number) => `You are an expert at extracting questions from JEE (Joint Entrance Examination) papers.

Extract all questions from this page image (Page ${pageNumber}). 

Instructions:
1. Look at the entire page image carefully
2. Identify each distinct question on the page
3. Extract the question number, question text/stem, and all answer options (A, B, C, D, etc.)
4. Note any diagrams, graphs, or figures that belong to each question
5. Provide a tight bounding box for each question region as "questionBbox" in NORMALIZED coordinates:
   - (0,0) is the top-left corner of the image; (1,1) is the bottom-right
   - It must cover: question number + stem + all options + any associated figure/diagram
   - Return tight boxes; avoid including neighboring questions
6. Try to identify the subject (Mathematics, Physics, Chemistry) and topic if possible
7. Preserve all mathematical notation and equations exactly as they appear in the image
8. Extract text exactly as shown, including any special formatting

Be thorough and extract all questions visible on this page.`;

function isApiError(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) return false;
  const message = 'message' in error ? String(error.message) : String(error);
  return message.includes('API') || message.includes('401') || message.includes('auth');
}

export async function extractQuestionsFromPageImage(
  pageImage: PageImage,
  model: string = 'google/gemini-3-flash-preview'
): Promise<ExtractedQuestion[]> {
  const content = [
    {
      type: 'text' as const,
      text: EXTRACTION_PROMPT(pageImage.pageNumber),
    },
    {
      type: 'image' as const,
      image: pageImage.base64,
    },
  ];

  try {
    // @ts-ignore - Type instantiation depth issue with AI SDK
    const { object } = await generateObject({
      model: openrouter(model),
      schema: extractionSchema,
      messages: [
        {
          role: 'user' as const,
          content: content as any,
        },
      ] as any,
      temperature: 0.1,
    });

    return object.questions.map((q) => ({
      questionNumber: q.questionNumber,
      questionText: q.questionText,
      options: q.options,
      hasImages: q.hasImages || false,
      imageIndices: q.imageIndices,
      images: undefined,
      questionBbox: q.questionBbox,
      subject: q.subject,
      topic: q.topic,
      pageNumber: pageImage.pageNumber,
      pageImagePath: pageImage.imagePath,
    }));
  } catch (error) {
    console.error(`Error extracting questions from page ${pageImage.pageNumber}:`, error);
    throw error;
  }
}

export async function extractQuestionsFromPageImages(
  pageImages: PageImage[],
  model?: string
): Promise<ExtractedQuestion[]> {
  const allQuestions: ExtractedQuestion[] = [];
  
  console.log(` Processing ${pageImages.length} page images...`);
  
  for (let i = 0; i < pageImages.length; i++) {
    const pageImage = pageImages[i];
    try {
      process.stdout.write(`  Page ${pageImage.pageNumber}/${pageImages.length}... `);
      const questions = await extractQuestionsFromPageImage(pageImage, model);
      allQuestions.push(...questions);
      console.log(`✓ Found ${questions.length} question(s)`);
    } catch (error) {
      if (isApiError(error)) {
        console.log(`✗ API error - check your OPENROUTER_API_KEY`);
        throw error;
      }
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.log(`✗ Error: ${errorMsg.substring(0, 50)}...`);
    }
  }
  
  return allQuestions;
}
