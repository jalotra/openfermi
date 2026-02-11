#!/usr/bin/env bash
set -euo pipefail

# Batch extraction script for JEE/NEET papers
# Usage: ./batch-extract.sh [--dry-run]
#
# Prerequisites:
#   - OPENROUTER_API_KEY in .env
#   - npm install (done)
#   - pip install -r requirements.txt (done)
#   - poppler installed (brew install poppler)
#
# For ingestion into the backend, run batch-ingest.sh after this.

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

DRY_RUN="${1:-}"

echo "=== OpenFermi Batch Extraction ==="
echo ""

if [ ! -f .env ]; then
  echo "ERROR: .env file not found. Create one with OPENROUTER_API_KEY."
  exit 1
fi

PAPER_COUNT=0
FAIL_COUNT=0

for pdf in papers/**/*.pdf; do
  if [ ! -f "$pdf" ]; then
    echo "No PDF files found in papers/"
    exit 1
  fi

  PAPER_COUNT=$((PAPER_COUNT + 1))
  filename=$(basename "$pdf" .pdf)
  source_name=$(echo "$filename" | tr '_' ' ' | sed 's/\b\(.\)/\u\1/g')

  echo "[$PAPER_COUNT] Extracting: $source_name"
  echo "    PDF: $pdf"

  if [ "$DRY_RUN" = "--dry-run" ]; then
    echo "    (dry run — skipping)"
    continue
  fi

  if npm run extract -- "$pdf" --source "$source_name"; then
    echo "    Done."
  else
    echo "    FAILED!"
    FAIL_COUNT=$((FAIL_COUNT + 1))
  fi
  echo ""
done

echo "=== Extraction Complete ==="
echo "Papers processed: $PAPER_COUNT"
echo "Failures: $FAIL_COUNT"
echo ""
echo "Output JSON files are in output/. Run batch-ingest.sh to upload to backend."
