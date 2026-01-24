import { ExtractedQuestion } from './question-extractor.js';
import { LaTeXQuestion } from './latex-converter.js';
import fs from 'fs';
import path from 'path';

export interface FormattedQuestion {
  id: string;
  title: string;
  question: string; // Plain text version
  latexQuestion: string; // LaTeX version
  difficulty: 'Easy' | 'Medium' | 'Hard';
  options: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  latexOptions?: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  images?: Array<{
    data?: string; // Base64 encoded (optional)
    format: string;
    filename?: string; // Image filename
    path?: string; // Path to image file
  }>;
  metadata: {
    source: string; // e.g., "JEE Advanced 2025"
    page: number;
    questionNumber: number;
    subject?: string;
    topic?: string;
    isMultiPart: boolean;
    parts?: Array<{
      partLabel: string;
      partText: string;
      latexText: string;
    }>;
  };
}

/**
 * Format extracted question with LaTeX into final JSON structure
 */
export function formatQuestion(
  extracted: ExtractedQuestion,
  latex: LaTeXQuestion,
  source: string
): FormattedQuestion {
  // Generate ID from source and question number
  const id = `${source.toLowerCase().replace(/\s+/g, '-')}-q${extracted.questionNumber}`;
  
  // Generate title from question text (first 50 chars)
  const title = extracted.questionText.substring(0, 50).replace(/\n/g, ' ').trim() + '...';
  
  // Map options to A, B, C, D format
  const options: { A: string; B: string; C: string; D: string } = {
    A: '',
    B: '',
    C: '',
    D: ''
  };
  
  const latexOptions: { A: string; B: string; C: string; D: string } = {
    A: '',
    B: '',
    C: '',
    D: ''
  };
  
  latex.options.forEach((opt, idx) => {
    const label = opt.label.toUpperCase();
    if (['A', 'B', 'C', 'D'].includes(label)) {
      options[label as 'A' | 'B' | 'C' | 'D'] = opt.text;
      latexOptions[label as 'A' | 'B' | 'C' | 'D'] = opt.latexText;
    }
  });
  
  // Determine difficulty (placeholder - could be enhanced with AI)
  const difficulty: 'Easy' | 'Medium' | 'Hard' = 'Medium';
  
  // Include page image reference if available
  const formattedImages = extracted.pageImagePath ? [{
    data: '', // Not storing base64 in JSON to keep file size manageable
    format: 'png',
    filename: path.basename(extracted.pageImagePath),
    path: extracted.pageImagePath
  }] : undefined;
  
  return {
    id,
    title,
    question: extracted.questionText,
    latexQuestion: latex.latexQuestion,
    difficulty,
    options,
    latexOptions: Object.values(latexOptions).some(v => v) ? latexOptions : undefined,
    images: formattedImages,
    metadata: {
      source,
      page: extracted.pageNumber,
      questionNumber: extracted.questionNumber,
      subject: extracted.subject,
      topic: extracted.topic,
      isMultiPart: extracted.isMultiPart,
      parts: latex.parts?.map(p => ({
        partLabel: p.partLabel,
        partText: p.partText,
        latexText: p.latexText
      }))
    }
  };
}

/**
 * Save formatted questions to JSON file
 */
export function saveQuestionsToJSON(
  questions: FormattedQuestion[],
  outputPath: string
): void {
  const outputDir = path.dirname(outputPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  const output = {
    metadata: {
      extractedAt: new Date().toISOString(),
      totalQuestions: questions.length,
      source: questions[0]?.metadata.source || 'Unknown'
    },
    questions: questions
  };
  
  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));
  console.log(` Saved ${questions.length} questions to ${outputPath}`);
}

// Note: Images are already saved as PNG files from PDF conversion
// No need for separate image saving function in image-based approach
