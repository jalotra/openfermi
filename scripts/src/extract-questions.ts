#!/usr/bin/env node

import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { convertPDFToImages, cropImageNormalized, loadSingleImage } from './image-processor.js';
import { extractQuestionsFromPageImages } from './question-extractor.js';
import { convertQuestionsToLaTeX } from './latex-converter.js';
import { formatQuestion, saveQuestionsToJSON } from './question-formatter.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

interface ExtractionOptions {
  inputPath: string;
  outputDir?: string;
  source?: string;
  extractionModel?: string;
  latexModel?: string;
  isImage?: boolean;
  embedImages?: boolean;
}

const SUPPORTED_IMAGE_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.webp'] as const;
const DEFAULT_MODEL = 'google/gemini-3-flash-preview';
const DEFAULT_SOURCE = 'JEE Advanced 2025';
const DEFAULT_DPI = 300;

function validateApiKey(): void {
  if (!process.env.OPENROUTER_API_KEY || process.env.OPENROUTER_API_KEY === 'your_openrouter_api_key_here') {
    console.error('\n Error: OPENROUTER_API_KEY not set!\n');
    console.error(' Please add your OpenRouter API key to .env file:');
    console.error('   OPENROUTER_API_KEY=your_actual_api_key_here\n');
    console.error(' Get your API key from: https://openrouter.ai/\n');
    process.exit(1);
  }
}

function detectFileType(filePath: string, isImageFlag: boolean): { isImage: boolean; isPdf: boolean } {
  const ext = path.extname(filePath).toLowerCase();
  const isImage = isImageFlag || SUPPORTED_IMAGE_EXTENSIONS.includes(ext as typeof SUPPORTED_IMAGE_EXTENSIONS[number]);
  const isPdf = ext === '.pdf';
  return { isImage, isPdf };
}

function validateInputFile(filePath: string, isImage: boolean, isPdf: boolean): void {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Input file not found: ${filePath}`);
  }
  if (!isImage && !isPdf) {
    const ext = path.extname(filePath).toLowerCase();
    throw new Error(`Unsupported file type: ${ext}. Please provide a PDF (.pdf) or image (.png, .jpg, .jpeg, .webp) file.`);
  }
}

async function extractQuestions(options: ExtractionOptions) {
  const {
    inputPath,
    outputDir = path.join(__dirname, '../output'),
    source = DEFAULT_SOURCE,
    extractionModel = process.env.EXTRACTION_MODEL || DEFAULT_MODEL,
    latexModel = process.env.LATEX_MODEL || DEFAULT_MODEL,
    isImage = false,
    embedImages = false,
  } = options;

  validateApiKey();

  const { isImage: isImageFile, isPdf: isPdfFile } = detectFileType(inputPath, isImage);
  validateInputFile(inputPath, isImageFile, isPdfFile);

  console.log(' Starting Question Extraction Pipeline\n');
  console.log(` Input: ${inputPath} (${isImageFile ? 'Image' : 'PDF'})`);
  console.log(` Output: ${outputDir}`);
  console.log(` Extraction Model: ${extractionModel}`);
  console.log(` LaTeX Model: ${latexModel}\n`);

  let pageImages;
  let tempImagesDir: string | undefined;

  if (isImageFile) {
    console.log(' Step 1: Loading image...');
    const singleImage = await loadSingleImage(inputPath, 1);
    pageImages = [singleImage];
    tempImagesDir = path.dirname(inputPath);
    console.log(` Loaded 1 image\n`);
  } else {
    tempImagesDir = path.join(outputDir, 'temp_images');
    console.log(' Step 1: Converting PDF pages to PNG images...');
    pageImages = await convertPDFToImages(inputPath, tempImagesDir, DEFAULT_DPI);
    console.log(` Converted ${pageImages.length} pages to images\n`);
  }

  console.log(' Step 2: Extracting questions from images using AI agent...');
  console.log(` This may take a while as we process ${pageImages.length} pages...\n`);
  const extractedQuestions = await extractQuestionsFromPageImages(pageImages, extractionModel);
  console.log(`\n Extracted ${extractedQuestions.length} questions total\n`);

  if (extractedQuestions.length === 0) {
    console.warn('  No questions extracted. Check the PDF format and try again.');
    return;
  }

  const sourceSlug = source.toLowerCase().replace(/\s+/g, '-');
  const year = new Date().getFullYear().toString();
  const imagesDir = path.join(outputDir, year, 'images', sourceSlug);

  console.log(' Step 3: Cropping per-question images...');
  let croppedCount = 0;
  for (const q of extractedQuestions) {
    if (!q.pageImagePath) continue;
    const filename = `${sourceSlug}-p${q.pageNumber}-q${q.questionNumber}.png`;
    const questionImagePath = path.join(imagesDir, filename);

    try {
      cropImageNormalized(q.pageImagePath, questionImagePath, q.questionBbox, { padPct: 0.02 });
      q.questionImagePath = questionImagePath;
      croppedCount += 1;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.warn(`  Warning: failed to crop image for q${q.questionNumber} (page ${q.pageNumber}): ${message}`);
    }
  }
  console.log(` Cropped ${croppedCount}/${extractedQuestions.length} question image(s)`);
  console.log(` Question crops: ${imagesDir}\n`);

  console.log(' Step 4: Converting questions to LaTeX format...');
  console.log(` This may take a while as we convert ${extractedQuestions.length} questions...\n`);
  const latexQuestions = await convertQuestionsToLaTeX(extractedQuestions, latexModel);
  console.log(`\n Converted ${latexQuestions.length} questions to LaTeX\n`);

  console.log(' Step 5: Formatting questions...');
  const formattedQuestions = extractedQuestions.map((extracted, idx) => {
    const latex = latexQuestions[idx];
    return formatQuestion(extracted, latex, source, { embedImages });
  });
  console.log(` Formatted ${formattedQuestions.length} questions\n`);

  console.log(' Step 6: Saving questions to JSON...');
  const yearDir = path.join(outputDir, year);
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
  const outputFilename = `${sourceSlug}-${timestamp}.json`;
  const outputPath = path.join(yearDir, outputFilename);
  saveQuestionsToJSON(formattedQuestions, outputPath);

  console.log('\n Extraction Complete!\n');
  console.log('Summary:');
  console.log(`  • ${isImageFile ? 'Image' : 'Pages'} processed: ${pageImages.length}`);
  console.log(`  • Questions extracted: ${formattedQuestions.length}`);
  console.log(`  • Output file: ${outputPath}`);
  if (tempImagesDir && !isImageFile) {
    console.log(`  • Page images: ${tempImagesDir}`);
  }
  console.log(`  • Question crops: ${imagesDir}`);
  console.log('');

  return {
    outputPath,
    questionsCount: formattedQuestions.length,
    imagesCount: formattedQuestions.reduce((sum, q) => sum + (q.images?.length || 0), 0),
  };
}

function parseCliArgs(args: string[]): ExtractionOptions {
  const inputPath = args[0];
  const options: ExtractionOptions = {
    inputPath: path.isAbsolute(inputPath) ? inputPath : path.join(__dirname, '..', inputPath),
  };

  for (let i = 1; i < args.length; i += 2) {
    const flag = args[i];
    const value = args[i + 1];
    
    switch (flag) {
      case '--output-dir':
        options.outputDir = value;
        break;
      case '--source':
        options.source = value;
        break;
      case '--extraction-model':
        options.extractionModel = value;
        break;
      case '--latex-model':
        options.latexModel = value;
        break;
      case '--image':
        options.isImage = true;
        i--;
        break;
      case '--embed-images':
        options.embedImages = true;
        i--;
        break;
    }
  }

  return options;
}

function printUsage(): void {
  console.log('Usage: npm run extract [pdf-path|image-path] [options]');
  console.log('\nOptions:');
  console.log('  --output-dir <dir>    Output directory (default: ./output)');
  console.log('  --source <name>       Source name (default: "JEE Advanced 2025")');
  console.log('  --extraction-model <model>  Model for extraction (default: google/gemini-3-flash-preview)');
  console.log('  --latex-model <model>       Model for LaTeX conversion (default: google/gemini-3-flash-preview)');
  console.log('  --image                Treat input as image file (auto-detected by extension)');
  console.log('  --embed-images         Embed question images as base64 data URIs in the output JSON');
  console.log('\nExamples:');
  console.log('  npm run extract papers/2025/jee_advanced_2025.pdf --source "JEE Advanced 2025"');
  console.log('  npm run extract output/temp_images/page_001.png --source "JEE Advanced 2025"');
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    printUsage();
    process.exit(1);
  }

  const options = parseCliArgs(args);

  try {
    await extractQuestions(options);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(' Error:', message);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { extractQuestions };
