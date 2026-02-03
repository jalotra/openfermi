import fs from 'fs';
import path from 'path';
import { ExtractedQuestion } from './question-extractor.js';
import { LaTeXQuestion } from './latex-converter.js';

export interface FormattedQuestion {
  id: string;
  title: string;
  question: string;
  latexQuestion: string;
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
    data?: string;
    format: string;
    filename?: string;
    path?: string;
  }>;
  metadata: {
    source: string;
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

const OPTION_LABELS = ['A', 'B', 'C', 'D'] as const;
type OptionLabel = typeof OPTION_LABELS[number];

function generateQuestionId(source: string, questionNumber: number): string {
  return `${source.toLowerCase().replace(/\s+/g, '-')}-q${questionNumber}`;
}

function generateQuestionTitle(questionText: string): string {
  const truncated = questionText.substring(0, 50).replace(/\n/g, ' ').trim();
  return truncated.length < questionText.length ? `${truncated}...` : truncated;
}

function mapOptionsToABCD(
  options: Array<{ label: string; text: string }>
): { A: string; B: string; C: string; D: string } {
  const mapped: { A: string; B: string; C: string; D: string } = {
    A: '',
    B: '',
    C: '',
    D: '',
  };

  options.forEach((opt) => {
    const label = opt.label.toUpperCase() as OptionLabel;
    if (OPTION_LABELS.includes(label)) {
      mapped[label] = opt.text;
    }
  });

  return mapped;
}

function mapLatexOptionsToABCD(
  options: Array<{ label: string; latexText: string }>
): { A: string; B: string; C: string; D: string } {
  const mapped: { A: string; B: string; C: string; D: string } = {
    A: '',
    B: '',
    C: '',
    D: '',
  };

  options.forEach((opt) => {
    const label = opt.label.toUpperCase() as OptionLabel;
    if (OPTION_LABELS.includes(label)) {
      mapped[label] = opt.latexText;
    }
  });

  return mapped;
}

function hasLatexOptions(latexOptions: { A: string; B: string; C: string; D: string }): boolean {
  return Object.values(latexOptions).some(v => v.trim().length > 0);
}

function tryEncodePngDataUri(filePath: string): string | undefined {
  try {
    const buffer = fs.readFileSync(filePath);
    const base64 = buffer.toString('base64');
    return `data:image/png;base64,${base64}`;
  } catch {
    return undefined;
  }
}

export function formatQuestion(
  extracted: ExtractedQuestion,
  latex: LaTeXQuestion,
  source: string,
  formatOptions: { embedImages?: boolean } = {}
): FormattedQuestion {
  const embedImages = formatOptions.embedImages ?? false;

  const id = generateQuestionId(source, extracted.questionNumber);
  const title = generateQuestionTitle(extracted.questionText);
  const options = mapOptionsToABCD(latex.options);
  const latexOptionsMap = mapLatexOptionsToABCD(latex.options);
  const latexOptions = hasLatexOptions(latexOptionsMap) ? latexOptionsMap : undefined;

  const imagePath = extracted.questionImagePath;
  const formattedImages = imagePath
    ? [{
        data: embedImages ? tryEncodePngDataUri(imagePath) : undefined,
        format: 'png',
        filename: path.basename(imagePath),
        path: imagePath,
      }]
    : undefined;
  
  return {
    id,
    title,
    question: extracted.questionText,
    latexQuestion: latex.latexQuestion,
    difficulty: 'Medium',
    options,
    latexOptions,
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
        latexText: p.latexText,
      })),
    },
  };
}

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
      source: questions[0]?.metadata.source || 'Unknown',
    },
    questions,
  };
  
  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));
  console.log(` Saved ${questions.length} questions to ${outputPath}`);
}
