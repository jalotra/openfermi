# OpenFermi Question Extraction Scripts

This directory contains scripts to extract questions from JEE past papers (PDFs), convert them to LaTeX format, and output structured JSON files ready for database ingestion.

## Features

-  **PDF to Image Conversion**: Converts PDF pages to PNG images using Python
-  **Vision-Based Extraction**: Uses Gemini 3 Flash vision model to extract questions directly from page images
-  **LaTeX Conversion**: Converts mathematical expressions to proper LaTeX format
-  **Structured Output**: Generates JSON files matching your question data structure

## Setup

### 1. Install Node.js dependencies:
```bash
npm install
```

### 2. Install Python dependencies:
```bash
pip install -r requirements.txt
```

**Note**: You may also need to install `poppler` for PDF processing:
- macOS: `brew install poppler`
- Linux: `sudo apt-get install poppler-utils`
- Windows: Download from https://github.com/oschwartz10612/poppler-windows/releases

### 3. Set up environment variables:
```bash
cp .env.example .env
# Edit .env and add your OPENROUTER_API_KEY
```

Get your API key from: https://openrouter.ai/

## Usage

### Basic Usage

Extract questions from a PDF:
```bash
npm run extract papers/2025/jee_advanced_2025.pdf
```

### With Options

```bash
npm run extract papers/2025/jee_advanced_2025.pdf \
  --source "JEE Advanced 2025" \
  --output-dir ./output \
  --extraction-model google/gemini-3-flash-preview \
  --latex-model google/gemini-3-flash-preview
```

### Output Structure

Questions are saved to `output/{year}/{source}-{date}.json` with the following structure:

```json
{
  "metadata": {
    "extractedAt": "2026-01-24T...",
    "totalQuestions": 10,
    "source": "JEE Advanced 2025"
  },
  "questions": [
    {
      "id": "jee-advanced-2025-q1",
      "title": "Question title...",
      "question": "Plain text question",
      "latexQuestion": "LaTeX formatted question with $\\frac{a}{b}$",
      "difficulty": "Medium",
      "options": {
        "A": "Option A text",
        "B": "Option B text",
        "C": "Option C text",
        "D": "Option D text"
      },
      "latexOptions": {
        "A": "LaTeX option A",
        "B": "LaTeX option B",
        "C": "LaTeX option C",
        "D": "LaTeX option D"
      },
      "images": [
        {
          "format": "png",
          "filename": "jee_advanced_2025_page_001.png",
          "path": "./output/temp_images/jee_advanced_2025_page_001.png"
        }
      ],
      "metadata": {
        "source": "JEE Advanced 2025",
        "page": 1,
        "questionNumber": 1,
        "subject": "Mathematics",
        "topic": "Calculus",
        "isMultiPart": false
      }
    }
  ]
}
```

Page images are saved to `output/temp_images/` directory.

## Architecture

The pipeline follows this flow:

1. **PDF to Images** (`pdf_to_images.py`): Converts PDF pages to PNG images
2. **Image Processor** (`src/image-processor.ts`): Loads images and prepares them for AI processing
3. **Question Extractor** (`src/question-extractor.ts`): AI agent extracts questions from page images using vision
4. **LaTeX Converter** (`src/latex-converter.ts`): AI agent converts math to LaTeX
5. **Question Formatter** (`src/question-formatter.ts`): Formats into final JSON structure
6. **Main Pipeline** (`src/extract-questions.ts`): Orchestrates the entire process

## Key Advantages of Image-Based Approach

- Better handling of complex layouts and formatting
- Preserves diagrams and figures naturally
- Works with scanned PDFs
- More accurate extraction of mathematical notation
- Handles multi-column layouts better

## Customization

### Changing AI Models

Edit `.env`:
```
EXTRACTION_MODEL=google/gemini-3-flash-preview
LATEX_MODEL=google/gemini-3-flash-preview
```

Or pass via CLI:
```bash
npm run extract paper.pdf --extraction-model anthropic/claude-3.5-sonnet
```

### Output Format

The JSON structure matches your frontend's question format. You can customize the structure in `src/question-formatter.ts`.

## Notes

- Page images are saved in `output/temp_images/` - you can delete this folder after processing if desired
- Each page image can be quite large (several MB at 300 DPI)
- Vision models can be slower than text-only extraction but provide better accuracy
- Complex multi-page questions may need manual review
