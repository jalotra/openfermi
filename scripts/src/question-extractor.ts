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
  text: z.string().describe('The option text content')
});

const questionSchema = z.object({
  questionNumber: z.number().describe('The question number as it appears in the paper'),
  questionText: z.string().describe('The main question text/stem'),
  options: z.array(optionSchema).describe('Array of answer options (typically A, B, C, D)'),
  hasImages: z.boolean().describe('Whether this question contains diagrams or images'),
  imageIndices: z.array(z.number()).optional().describe('Indices of images from the page that belong to this question'),
  subject: z.string().optional().describe('Subject area if identifiable (e.g., Mathematics, Physics, Chemistry)'),
  topic: z.string().optional().describe('Topic or chapter if identifiable'),
  isMultiPart: z.boolean().describe('Whether this is a multi-part question'),
  parts: z.array(z.object({
    partLabel: z.string().describe('Part label (e.g., "a", "b", "i", "ii")'),
    partText: z.string().describe('Part question text')
  })).optional().describe('Sub-parts if this is a multi-part question')
});

const extractionSchema = z.object({
  questions: z.array(questionSchema).describe('Array of extracted questions from the page')
});

export interface ExtractedQuestion {
  questionNumber: number;
  questionText: string;
  options: Array<{ label: string; text: string }>;
  hasImages: boolean;
  imageIndices?: number[];
  images?: any[]; // Not used in image-based approach
  subject?: string;
  topic?: string;
  isMultiPart: boolean;
  parts?: Array<{ partLabel: string; partText: string }>;
  pageNumber: number;
  pageImagePath?: string; // Path to the page image
}

/**
 * Extract questions from a PDF page image using AI agent (vision-based)
 */
export async function extractQuestionsFromPageImage(
  pageImage: PageImage,
  model: string = 'google/gemini-3-flash-preview'
): Promise<ExtractedQuestion[]> {
  try {
    // Prepare content with image
    const content: Array<{ type: 'text' | 'image'; text?: string; image?: string }> = [
      {
        type: 'text',
        text: `You are an expert at extracting questions from JEE (Joint Entrance Examination) papers. 

Extract all questions from this page image (Page ${pageImage.pageNumber}). 

Instructions:
1. Look at the entire page image carefully
2. Identify each distinct question on the page
3. Extract the question number, question text/stem, and all answer options (A, B, C, D, etc.)
4. If a question has multiple parts (like a(i), a(ii), b(i), etc.), mark it as multi-part and extract each part
5. Note any diagrams, graphs, or figures that belong to each question
6. Try to identify the subject (Mathematics, Physics, Chemistry) and topic if possible
7. Preserve all mathematical notation and equations exactly as they appear in the image
8. Extract text exactly as shown, including any special formatting

Be thorough and extract all questions visible on this page.`
      },
      {
        type: 'image',
        image: pageImage.base64
      }
    ];

    // @ts-ignore - Type instantiation depth issue with AI SDK
    const { object } = await generateObject({
      model: openrouter(model),
      schema: extractionSchema,
      messages: [
        {
          role: 'user',
          content: content
        }
      ] as any,
      temperature: 0.1, // Low temperature for consistent extraction
    });

    // Map extracted questions
    return object.questions.map((q: any) => ({
      questionNumber: q.questionNumber,
      questionText: q.questionText,
      options: q.options,
      hasImages: q.hasImages || false,
      imageIndices: q.imageIndices,
      images: undefined, // Images are embedded in the page image
      subject: q.subject,
      topic: q.topic,
      isMultiPart: q.isMultiPart,
      parts: q.parts,
      pageNumber: pageImage.pageNumber,
      pageImagePath: pageImage.imagePath // Store reference to page image
    }));
  } catch (error) {
    console.error(`Error extracting questions from page ${pageImage.pageNumber}:`, error);
    throw error;
  }
}

/**
 * Extract questions from multiple page images
 */
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
    } catch (error: any) {
      const errorMsg = error?.message || error?.toString() || 'Unknown error';
      if (errorMsg.includes('API') || errorMsg.includes('401') || errorMsg.includes('auth')) {
        console.log(`✗ API error - check your OPENROUTER_API_KEY`);
        throw error; // Stop processing if API key issue
      }
      console.log(`✗ Error: ${errorMsg.substring(0, 50)}...`);
      // Continue with other pages
    }
  }
  
  return allQuestions;
}
