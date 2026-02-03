# Scripts Development Guidelines

## Overview

This folder contains the **question extraction pipeline** — a set of TypeScript (Node ESM) scripts that convert JEE exam PDFs into structured JSON ready for backend ingestion.

### Tech Stack
- **Runtime**: Node.js 20+ (ESM modules)
- **Language**: TypeScript 5
- **AI SDK**: Vercel AI SDK (`ai`) + OpenRouter provider (`@openrouter/ai-sdk-provider`)
- **Schema validation**: Zod
- **PDF → Images**: Python (`pdf2image` + Pillow) invoked via `child_process`

### Directory Structure

```
scripts/
├── python/
│   ├── pdf_to_images.py           # Python helper for PDF conversion
│   ├── crop_image.py              # Python helper for image cropping
│   └── upload_images_and_ingest.py # Upload crops to S3 + ingest into backend
├── src/
│   ├── extract-questions.ts   # Main CLI entrypoint
│   ├── image-processor.ts     # PDF→images (calls Python) + image loading
│   ├── question-extractor.ts  # AI vision extraction from page images
│   ├── latex-converter.ts     # AI LaTeX conversion
│   └── question-formatter.ts  # Final JSON formatting + file output
├── papers/                    # Input PDFs
├── output/                    # Generated JSON + images (gitignored)
├── package.json
├── tsconfig.json
└── requirements.txt           # Python deps
```

## Pipeline Flow

```
PDF file
    │
    ▼
python/pdf_to_images.py (Python + poppler)
    │
    ▼
Page PNG images
    │
    ▼
question-extractor.ts (Gemini vision)
    │
    ▼
Extracted questions (plain text)
    │
    ▼
latex-converter.ts (Gemini)
    │
    ▼
LaTeX-formatted questions
    │
    ▼
question-formatter.ts
    │
    ▼
output/{year}/{source}-{date}.json
```

## Best Practices

### Code Style
- **Pure helpers**: Keep functions small and side-effect-free where possible.
- **No unused exports**: If a function isn't used outside its file, don't export it.
- **Consistent error handling**: Catch errors, log context, and re-throw or exit cleanly.
- **Avoid `any`**: Use explicit types or Zod schemas; fall back to `unknown` + type guards.

### File Naming
- `kebab-case.ts` for all source files.
- Exported interfaces/types use `PascalCase`.
- Helper functions use `camelCase`.

### Environment
- All secrets go in `.env` (gitignored).
- Required: `OPENROUTER_API_KEY`.
- Optional overrides: `EXTRACTION_MODEL`, `LATEX_MODEL`.

### External Dependencies
- **Python 3** must be available as `python3`.
- **poppler** must be installed (`brew install poppler` / `apt-get install poppler-utils`).

## Common Commands

```bash
# Install Node dependencies
npm install

# Install Python dependencies
pip install -r requirements.txt

# Run extraction on a PDF
npm run extract papers/2025/jee_advanced_2025.pdf --source "JEE Advanced 2025"

# Run extraction on a single image
npm run extract output/temp_images/page_001.png --source "JEE Advanced 2025"

# Type-check (optional, best-effort)
npx tsc --noEmit
```

## Post-Coding Steps

After making changes:

1. **Type-check** (optional but recommended):
   ```bash
   npx tsc --noEmit
   ```
2. **Smoke test** — run the CLI with `--help` or on a small input to verify nothing broke:
   ```bash
   npm run extract -- papers/2025/jee_advanced_2025.pdf --source "JEE Advanced 2025"
   ```
3. **Keep docs in sync** — if you change the pipeline, update `README.md` and this file.
