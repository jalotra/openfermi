#!/usr/bin/env python3
"""
End-to-end extraction workflow orchestrator.

  1. Extract questions from PDF/image -> JSON + cropped images  (via npm run extract)
  2. Upload images to S3 (deduped by SHA-256)
  3. Ingest questions into one or more backend endpoints

Usage:
  python3 python/run_workflow.py --pdf papers/2025/jee_advanced_2025.pdf --source "JEE Advanced 2025"
  python3 python/run_workflow.py --json output/2026/jee-advanced-2025-2026-02-03.json   # skip extraction

Configuration is loaded from workflow.config.yaml (see workflow.config.yaml.example).
"""

from __future__ import annotations

import traceback
import argparse
import os
import subprocess
import sys
from pathlib import Path
from typing import Any, Dict, List

import yaml

import upload_images_and_ingest

SCRIPT_DIR = Path(__file__).resolve().parent.parent


def load_config(config_path: Path) -> Dict[str, Any]:
    if not config_path.exists():
        print(f"Error: config file not found: {config_path}", file=sys.stderr)
        print(
            "Copy workflow.config.yaml.example to workflow.config.yaml and fill in your values.",
            file=sys.stderr,
        )
        sys.exit(1)

    with config_path.open("r", encoding="utf-8") as f:
        cfg = yaml.safe_load(f)

    if not isinstance(cfg, dict):
        print(f"Error: invalid config file: {config_path}", file=sys.stderr)
        sys.exit(1)

    s3 = cfg.get("s3") or {}
    if not s3.get("bucket"):
        print("Error: s3.bucket must be set in config", file=sys.stderr)
        sys.exit(1)
    if not s3.get("region"):
        print("Error: s3.region must be set in config", file=sys.stderr)
        sys.exit(1)

    backends = cfg.get("backends")
    if not isinstance(backends, list) or len(backends) == 0:
        print("Error: backends list must be non-empty in config", file=sys.stderr)
        sys.exit(1)

    return cfg


def run_extraction(input_path: str, source: str | None, embed_images: bool) -> Path:
    """Run npm run extract and return the path to the output JSON."""
    cmd = ["npm", "run", "extract", "--", input_path]
    if source:
        cmd += ["--source", source]
    if embed_images:
        cmd += ["--embed-images"]

    print(f"Step 1: Extracting questions from {input_path}")
    result = subprocess.run(cmd, cwd=str(SCRIPT_DIR))
    if result.returncode != 0:
        print("Error: extraction failed", file=sys.stderr)
        sys.exit(1)

    output_dir = SCRIPT_DIR / "output"
    json_files = sorted(
        [
            p
            for p in output_dir.rglob("*.json")
            if not p.name.endswith(".ingest-report.json")
            and not p.name.endswith(".s3.json")
        ],
        key=lambda p: p.stat().st_mtime,
        reverse=True,
    )

    if not json_files:
        print("Error: could not find output JSON after extraction", file=sys.stderr)
        sys.exit(1)

    json_path = json_files[0]
    print(f"Extraction complete. JSON: {json_path}\n")
    return json_path


def run_ingest(
    json_path: Path,
    cfg: Dict[str, Any],
    dry_run: bool,
) -> int:
    """Upload to S3 + ingest into each configured backend. Returns failure count."""
    s3 = cfg["s3"]
    backends: List[Dict[str, str]] = cfg["backends"]
    fail_count = 0

    for i, backend in enumerate(backends):
        url = backend["url"]
        api_key = backend.get("api_key", "")

        print(
            f"Step 2/3 [{i + 1}/{len(backends)}]: Uploading to S3 + ingesting into {url}"
        )

        argv: List[str] = [
            "--json",
            str(json_path),
            "--bucket",
            s3["bucket"],
            "--region",
            s3["region"],
            "--backend-url",
            url,
        ]
        if api_key:
            argv += ["--api-key", api_key]
        if dry_run:
            argv += ["--dry-run"]

        try:
            rc = upload_images_and_ingest.main(argv)
            if rc != 0:
                raise RuntimeError(f"exit code {rc}")
            print(f"  Done ({url})\n")
        except Exception as e:
            traceback.print_exc()
            print(f"  FAILED ({url}): {e}\n", file=sys.stderr)
            fail_count += 1

    return fail_count


def main() -> int:
    parser = argparse.ArgumentParser(
        description="End-to-end extraction workflow orchestrator."
    )
    input_group = parser.add_mutually_exclusive_group(required=True)
    input_group.add_argument("--pdf", help="Path to PDF file to extract from")
    input_group.add_argument("--image", help="Path to image file to extract from")
    input_group.add_argument(
        "--json", help="Path to already-extracted JSON (skips extraction)"
    )

    parser.add_argument("--source", help="Source name (e.g. 'JEE Advanced 2025')")
    parser.add_argument(
        "--config",
        default=str(SCRIPT_DIR / "workflow.config.yaml"),
        help="Path to config YAML",
    )
    parser.add_argument(
        "--dry-run", action="store_true", help="No S3 uploads and no backend POSTs"
    )
    parser.add_argument(
        "--embed-images",
        action="store_true",
        help="Embed images as base64 in extraction JSON",
    )

    args = parser.parse_args()

    cfg = load_config(Path(args.config))

    print("=== OpenFermi Extraction Workflow ===\n")

    if args.json:
        json_path = Path(args.json).resolve()
        if not json_path.exists():
            print(f"Error: JSON file not found: {json_path}", file=sys.stderr)
            return 1
        print(f"Skipping extraction (using provided JSON: {json_path})\n")
    else:
        input_file = args.pdf or args.image
        json_path = run_extraction(input_file, args.source, args.embed_images)

    fail_count = run_ingest(json_path, cfg, args.dry_run)

    print("=== Workflow Complete ===")
    print(f"  JSON: {json_path}")
    print(f"  Backends: {len(cfg['backends'])}")
    print(f"  Failures: {fail_count}")

    return 1 if fail_count > 0 else 0


if __name__ == "__main__":
    raise SystemExit(main())
