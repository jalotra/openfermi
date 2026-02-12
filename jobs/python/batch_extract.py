#!/usr/bin/env python3
"""
Batch extraction script for JEE/NEET papers.

Walks papers/ for PDFs and runs `npm run extract` for each.

Usage:
  python3 python/batch_extract.py [--dry-run]

Prerequisites:
  - OPENROUTER_API_KEY in .env
  - npm install (done)
  - pip install -r requirements.txt (done)
  - poppler installed (brew install poppler)
"""

from __future__ import annotations

import argparse
import subprocess
import sys
from pathlib import Path

SCRIPT_DIR = Path(__file__).resolve().parent.parent  # scripts/


def title_case(filename: str) -> str:
    return filename.replace("_", " ").title()


def main() -> int:
    parser = argparse.ArgumentParser(description="Batch extraction of JEE/NEET papers.")
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Print what would be done without running extraction",
    )
    args = parser.parse_args()

    env_file = SCRIPT_DIR / ".env"
    if not env_file.exists():
        print(
            "ERROR: .env file not found. Create one with OPENROUTER_API_KEY.",
            file=sys.stderr,
        )
        return 1

    papers_dir = SCRIPT_DIR / "papers"
    pdfs = sorted(papers_dir.rglob("*.pdf")) if papers_dir.exists() else []

    if not pdfs:
        print("No PDF files found in papers/", file=sys.stderr)
        return 1

    print("=== OpenFermi Batch Extraction ===\n")

    fail_count = 0
    for i, pdf in enumerate(pdfs, 1):
        source_name = title_case(pdf.stem)
        rel = pdf.relative_to(SCRIPT_DIR)

        print(f"[{i}] Extracting: {source_name}")
        print(f"    PDF: {rel}")

        if args.dry_run:
            print("    (dry run -- skipping)")
            continue

        result = subprocess.run(
            ["npm", "run", "extract", "--", str(rel), "--source", source_name],
            cwd=str(SCRIPT_DIR),
        )
        if result.returncode == 0:
            print("    Done.")
        else:
            print("    FAILED!")
            fail_count += 1
        print()

    print("=== Extraction Complete ===")
    print(f"Papers processed: {len(pdfs)}")
    print(f"Failures: {fail_count}")
    print(
        "\nOutput JSON files are in output/. Run batch_ingest.py to upload to backend."
    )

    return 1 if fail_count > 0 else 0


if __name__ == "__main__":
    raise SystemExit(main())
