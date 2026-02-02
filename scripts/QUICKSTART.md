# Quick Start Guide

## Installation

```bash
cd scripts
npm install
pip install -r requirements.txt
```

**Note**: You also need `poppler` installed for PDF-to-image conversion:
- macOS: `brew install poppler`
- Linux: `sudo apt-get install poppler-utils`
- Windows: Download from https://github.com/oschwartz10612/poppler-windows/releases

## Setup

1. Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

2. Add your OpenRouter API key to `.env`:
```
OPENROUTER_API_KEY=your_key_here
```

Get your API key from: https://openrouter.ai/

## Run Extraction

### From PDF:
```bash
npm run extract papers/2025/jee_advanced_2025.pdf --source "JEE Advanced 2025"
```

### From Single Image:
```bash
npm run extract output/temp_images/page_001.png --source "JEE Advanced 2025"
```

The script automatically detects PDF vs image files by extension. Supported image formats: `.png`, `.jpg`, `.jpeg`, `.webp`

## Output

The script will create:
- `output/2025/jee-advanced-2025-{date}.json` - Questions in JSON format
- `output/2025/images/` - All extracted images

## JSON Structure

Each question in the JSON file includes:
- `id`: Unique identifier
- `question`: Plain text version
- `latexQuestion`: LaTeX formatted version
- `options`: A, B, C, D options (plain text)
- `latexOptions`: A, B, C, D options (LaTeX)
- `images`: Array of base64-encoded images with metadata
- `metadata`: Source, page number, question number, subject, topic

## Troubleshooting

### PDF conversion failing?
- Ensure Python 3 is available as `python3`.
- Ensure `poppler` is installed (see Installation above).
- Ensure Python deps are installed: `pip install -r requirements.txt`.

### Questions not extracting correctly?
- Check the PDF format — scanned PDFs may need OCR preprocessing.
- Try a different AI model: `--extraction-model anthropic/claude-3.5-sonnet`.

### LaTeX conversion issues?
- Mathematical notation should be preserved.
- Complex diagrams may need manual review.
- Try a different model: `--latex-model google/gemini-3-flash-preview`.
