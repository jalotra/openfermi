#!/usr/bin/env python3
"""
Batch ingestion script -- uploads images to S3 and ingests questions into backends.

Walks output/ for JSON files and calls upload_images_and_ingest for each,
targeting every backend defined in workflow.config.yaml.

Usage:
  python3 python/batch_ingest.py [--config workflow.config.yaml] [--dry-run]

Prerequisites:
  - AWS credentials configured (AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY or ~/.aws/credentials)
  - Backend(s) running
  - pip install -r requirements.txt
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path
from typing import Any, Dict, List

import yaml

import upload_images_and_ingest

SCRIPT_DIR = Path(__file__).resolve().parent.parent  # scripts/


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

    return cfg


def find_json_files() -> List[Path]:
    output_dir = SCRIPT_DIR / "output"
    if not output_dir.exists():
        return []

    return sorted(
        [
            p
            for p in output_dir.rglob("*.json")
            if not p.name.endswith(".ingest-report.json")
            and not p.name.endswith(".s3.json")
        ],
        key=lambda p: p.stat().st_mtime,
    )


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Batch ingestion: upload images to S3 + ingest into backends."
    )
    parser.add_argument(
        "--config",
        default=str(SCRIPT_DIR / "workflow.config.yaml"),
        help="Path to config YAML",
    )
    parser.add_argument(
        "--dry-run", action="store_true", help="No S3 uploads and no backend POSTs"
    )
    args = parser.parse_args()

    cfg = load_config(Path(args.config))
    s3 = cfg.get("s3") or {}
    bucket = s3.get("bucket")
    region = s3.get("region")
    backends: List[Dict[str, str]] = cfg.get("backends") or []

    if not bucket or not region:
        print("Error: s3.bucket and s3.region must be set in config", file=sys.stderr)
        return 1
    if not backends:
        print("Error: backends list must be non-empty in config", file=sys.stderr)
        return 1

    json_files = find_json_files()
    if not json_files:
        print(
            "No JSON files found in output/. Run batch_extract.py first.",
            file=sys.stderr,
        )
        return 1

    print("=== OpenFermi Batch Ingestion ===")
    print(f"  Bucket: {bucket}")
    print(f"  Region: {region}")
    print(f"  Backends: {', '.join(b['url'] for b in backends)}")
    if args.dry_run:
        print("  Mode: DRY RUN")
    print()

    total_fail = 0

    for ji, json_file in enumerate(json_files, 1):
        print(f"[{ji}] Ingesting: {json_file.relative_to(SCRIPT_DIR)}")

        for bi, backend in enumerate(backends):
            url = backend["url"]
            api_key = backend.get("api_key", "")

            argv: List[str] = [
                "--json",
                str(json_file),
                "--bucket",
                bucket,
                "--region",
                region,
                "--backend-url",
                url,
            ]
            if api_key:
                argv += ["--api-key", api_key]
            if args.dry_run:
                argv += ["--dry-run"]

            try:
                rc = upload_images_and_ingest.main(argv)
                if rc != 0:
                    raise RuntimeError(f"exit code {rc}")
                print(f"    Done ({url})")
            except Exception as e:
                print(f"    FAILED ({url}): {e}", file=sys.stderr)
                total_fail += 1

        print()

    print("=== Ingestion Complete ===")
    print(f"Files processed: {len(json_files)}")
    print(f"Failures: {total_fail}")

    return 1 if total_fail > 0 else 0


if __name__ == "__main__":
    raise SystemExit(main())
