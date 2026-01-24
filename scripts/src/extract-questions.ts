#!/usr/bin/env node

import { convertPDFToImages } from './image-processor.js';
import { extractQuestionsFromPageImages } from './question-extractor.js';
import { convertQuestionsToLaTeX } from './latex-converter.js';
import { formatQuestion, saveQuestionsToJSON } from './question-formatter.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
import dotenv from 'dotenv';
import { resolve } from 'path';
dotenv.config({ path: resolve(__dirname, '../.env') });

interface ExtractionOptions {
  pdfPath: string;
  outputDir?: string;
  source?: string;
  extractionModel?: string;
  latexModel?: string;
}

/**
 * Main extraction pipeline
 */
async function extractQuestions(options: ExtractionOptions) {
  const {
    pdfPath,
    outputDir = path.join(__dirname, '../output'),
    source = 'JEE Advanced 2025',
    extractionModel = process.env.EXTRACTION_MODEL || 'google/gemini-3-flash-preview',
    latexModel = process.env.LATEX_MODEL || 'google/gemini-3-flash-preview'
  } = options;

  // Check API key
  if (!process.env.OPENROUTER_API_KEY || process.env.OPENROUTER_API_KEY === 'your_openrouter_api_key_here') {
    console.error('\n Error: OPENROUTER_API_KEY not set!\n');
    console.error(' Please add your OpenRouter API key to .env file:');
    console.error('   OPENROUTER_API_KEY=your_actual_api_key_here\n');
    console.error(' Get your API key from: https://openrouter.ai/\n');
    process.exit(1);
  }

  console.log(' Starting PDF to LaTeX Question Extraction Pipeline\n');
  console.log(` PDF: ${pdfPath}`);
  console.log(` Output: ${outputDir}`);
  console.log(` Extraction Model: ${extractionModel}`);
  console.log(` LaTeX Model: ${latexModel}\n`);

  // Validate PDF exists
  if (!fs.existsSync(pdfPath)) {
    throw new Error(`PDF file not found: ${pdfPath}`);
  }

  // Step 1: Convert PDF pages to PNG images
  const tempImagesDir = path.join(outputDir, 'temp_images');
  console.log(' Step 1: Converting PDF pages to PNG images...');
  const pageImages = await convertPDFToImages(pdfPath, tempImagesDir, 300);
  console.log(` Converted ${pageImages.length} pages to images\n`);

  // Step 2: Extract questions using AI agent (vision-based)
  console.log(' Step 2: Extracting questions from images using AI agent...');
  console.log(` This may take a while as we process ${pageImages.length} pages...\n`);
  const extractedQuestions = await extractQuestionsFromPageImages(pageImages, extractionModel);
  console.log(`\n Extracted ${extractedQuestions.length} questions total\n`);

  if (extractedQuestions.length === 0) {
    console.warn('  No questions extracted. Check the PDF format and try again.');
    return;
  }

  // Step 3: Convert questions to LaTeX
  console.log(' Step 3: Converting questions to LaTeX format...');
  console.log(` This may take a while as we convert ${extractedQuestions.length} questions...\n`);
  const latexQuestions = await convertQuestionsToLaTeX(extractedQuestions, latexModel);
  console.log(`\n Converted ${latexQuestions.length} questions to LaTeX\n`);

  // Step 4: Format questions into final structure
  console.log(' Step 4: Formatting questions...');
  const formattedQuestions = extractedQuestions.map((extracted, idx) => {
    const latex = latexQuestions[idx];
    return formatQuestion(extracted, latex, source);
  });
  console.log(` Formatted ${formattedQuestions.length} questions\n`);

  // Step 5: Save questions to JSON
  console.log(' Step 5: Saving questions to JSON...');
  const sourceSlug = source.toLowerCase().replace(/\s+/g, '-');
  const year = new Date().getFullYear().toString();
  const yearDir = path.join(outputDir, year);
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
  const outputFilename = `${sourceSlug}-${timestamp}.json`;
  const outputPath = path.join(yearDir, outputFilename);
  saveQuestionsToJSON(formattedQuestions, outputPath);

  // Clean up temp images (optional - comment out if you want to keep them)
  // fs.rmSync(tempImagesDir, { recursive: true, force: true });
  // console.log(' Cleaned up temporary images\n');

  // Generate summary
  console.log('\n Extraction Complete!\n');
  console.log('Summary:');
  console.log(`  • Pages processed: ${pageImages.length}`);
  console.log(`  • Questions extracted: ${formattedQuestions.length}`);
  console.log(`  • Output file: ${outputPath}`);
  console.log(`  • Page images: ${tempImagesDir}\n`);

  return {
    outputPath,
    questionsCount: formattedQuestions.length,
    imagesCount: formattedQuestions.reduce((sum, q) => sum + (q.images?.length || 0), 0)
  };
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('Usage: npm run extract [pdf-path] [options]');
    console.log('\nOptions:');
    console.log('  --output-dir <dir>    Output directory (default: ./output)');
    console.log('  --source <name>       Source name (default: "JEE Advanced 2025")');
    console.log('  --extraction-model <model>  Model for extraction (default: google/gemini-3-flash-preview)');
    console.log('  --latex-model <model>       Model for LaTeX conversion (default: google/gemini-3-flash-preview)');
    console.log('\nExample:');
    console.log('  npm run extract papers/2025/jee_advanced_2025.pdf --source "JEE Advanced 2025"');
    process.exit(1);
  }

  const pdfPath = args[0];
  const options: ExtractionOptions = {
    pdfPath: path.isAbsolute(pdfPath) ? pdfPath : path.join(__dirname, '..', pdfPath)
  };

  // Parse arguments
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
    }
  }

  try {
    await extractQuestions(options);
  } catch (error) {
    console.error(' Error:', error);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { extractQuestions };
