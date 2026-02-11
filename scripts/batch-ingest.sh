#!/usr/bin/env bash
set -euo pipefail

# Batch ingestion script — uploads images to S3 and ingests questions into backend
# Usage: ./batch-ingest.sh --bucket <bucket> --region <region> [--backend-url <url>] [--dry-run]
#
# Prerequisites:
#   - AWS credentials configured (AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY or ~/.aws/credentials)
#   - Backend running (default: http://localhost:8080)
#   - pip install boto3 requests python-dotenv

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

BUCKET=""
REGION=""
BACKEND_URL="http://localhost:8080"
DRY_RUN=""
API_KEY=""

while [[ $# -gt 0 ]]; do
  case $1 in
    --bucket) BUCKET="$2"; shift 2 ;;
    --region) REGION="$2"; shift 2 ;;
    --backend-url) BACKEND_URL="$2"; shift 2 ;;
    --api-key) API_KEY="$2"; shift 2 ;;
    --dry-run) DRY_RUN="--dry-run"; shift ;;
    *) echo "Unknown option: $1"; exit 1 ;;
  esac
done

if [ -z "$BUCKET" ] || [ -z "$REGION" ]; then
  echo "Usage: ./batch-ingest.sh --bucket <bucket> --region <region> [--backend-url <url>] [--dry-run]"
  exit 1
fi

echo "=== OpenFermi Batch Ingestion ==="
echo "  Bucket: $BUCKET"
echo "  Region: $REGION"
echo "  Backend: $BACKEND_URL"
[ -n "$DRY_RUN" ] && echo "  Mode: DRY RUN"
echo ""

JSON_COUNT=0
FAIL_COUNT=0

for json_file in output/**/*.json; do
  if [ ! -f "$json_file" ]; then
    echo "No JSON files found in output/. Run batch-extract.sh first."
    exit 1
  fi

  # Skip report files
  if [[ "$json_file" == *.ingest-report.json ]] || [[ "$json_file" == *.s3.json ]]; then
    continue
  fi

  JSON_COUNT=$((JSON_COUNT + 1))
  echo "[$JSON_COUNT] Ingesting: $json_file"

  CMD="python3 python/upload_images_and_ingest.py --json $json_file --bucket $BUCKET --region $REGION --backend-url $BACKEND_URL"
  [ -n "$API_KEY" ] && CMD="$CMD --api-key $API_KEY"
  [ -n "$DRY_RUN" ] && CMD="$CMD --dry-run"

  if eval "$CMD"; then
    echo "    Done."
  else
    echo "    FAILED!"
    FAIL_COUNT=$((FAIL_COUNT + 1))
  fi
  echo ""
done

echo "=== Ingestion Complete ==="
echo "Files processed: $JSON_COUNT"
echo "Failures: $FAIL_COUNT"
