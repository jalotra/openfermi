#!/usr/bin/env python3
"""
Upload extracted question images to S3, then ingest questions into the backend.

Reads JSON files produced by the extraction pipeline (scripts/output/**/*.json),
uploads referenced images to S3 (deduped by SHA-256), and POSTs each question
as a QuestionDto to the backend.

Usage:
  python3 upload_images_and_ingest.py --json output/2026/jee-advanced-2025.json \
      --bucket my-bucket --region us-east-1
"""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import re
import sys
from dataclasses import dataclass, asdict
from pathlib import Path
from typing import Any, Dict, List, Optional

try:
    import boto3
    import requests
except ImportError:
    print("Error: boto3 and requests are required to run this script. Please install them using 'pip install boto3 requests'.")
    sys.exit(1)

try:
    if not os.environ.get("S3_ACCESS_KEY_ID") or not os.environ.get("S3_SECRET_ACCESS_KEY") or not os.environ.get("AWS_REGION"):
        print("Error: S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY and AWS_REGION are required to run this script. Please set them in the environment variables.")
        sys.exit(1)
    else:
        s3_client = boto3.Session(
            aws_access_key_id=os.environ.get("S3_ACCESS_KEY_ID"),
            aws_secret_access_key=os.environ.get("S3_SECRET_ACCESS_KEY"),
        ).client("s3", region_name=os.environ.get("AWS_REGION"))
except Exception as e:
    print(f"Error: {e}")
    sys.exit(1)



SUBJECT_MAP = {
    "math": "MATHEMATICS",
    "maths": "MATHEMATICS",
    "mathematics": "MATHEMATICS",
    "physics": "PHYSICS",
    "chemistry": "CHEMISTRY",
    "biology": "BIOLOGY",
}

DIFFICULTY_MAP = {"easy": "EASY", "medium": "MEDIUM", "hard": "HARD"}

CONTENT_TYPE_MAP = {
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".webp": "image/webp",
}


@dataclass
class QuestionDto:
    questionText: str
    latexQuestionText: Optional[str] = None
    subject: Optional[str] = None
    examType: Optional[str] = None
    difficulty: str = "MEDIUM"
    options: Optional[List[str]] = None
    correctAnswer: Optional[str] = None
    explanation: Optional[str] = None
    imageUrls: Optional[List[str]] = None
    year: Optional[int] = None
    paperNumber: Optional[int] = None
    questionNumber: Optional[int] = None
    tags: Optional[List[str]] = None
    topic: Optional[str] = None
    marks: Optional[int] = None
    negativeMarks: Optional[float] = None
    isActive: bool = True
    metadata: Optional[Dict[str, str]] = None

    def to_dict(self) -> Dict[str, Any]:
        d = asdict(self)
        return {k: v for k, v in d.items() if v is not None}


def upload_image_to_s3(
    s3_client: boto3.client, bucket: str, prefix: str, file_path: Path, public_base_url: str
) -> str:
    """Hash the file, upload to S3 if not already there, return the public URL."""
    from botocore.exceptions import ClientError

    hash_hex = hashlib.sha256(file_path.read_bytes()).hexdigest()
    ext = file_path.suffix.lower() or ".png"
    key = f"{prefix}/{hash_hex[:2]}/{hash_hex}{ext}"
    url = f"{public_base_url}/{key}"

    try:
        s3_client.head_object(Bucket=bucket, Key=key)
        print(f"    [exists] {file_path.name}")
        return url
    except ClientError as e:
        # 403 can mean "object doesn't exist" when the bucket policy denies ListBucket
        if e.response["Error"]["Code"] not in ("403", "404", "NoSuchKey", "NotFound"):
            raise

    content_type = CONTENT_TYPE_MAP.get(ext, "application/octet-stream")
    s3_client.upload_file(
        Filename=str(file_path),
        Bucket=bucket,
        Key=key,
        ExtraArgs={
            "ContentType": content_type,
            "CacheControl": "public, max-age=31536000, immutable",
        },
    )
    print(f"    [uploaded] {file_path.name}")
    return url


def map_subject(raw: str) -> Optional[str]:
    s = raw.strip().lower()
    if s in SUBJECT_MAP:
        return SUBJECT_MAP[s]
    for fragment, mapped in [
        ("math", "MATHEMATICS"),
        ("phys", "PHYSICS"),
        ("chem", "CHEMISTRY"),
        ("bio", "BIOLOGY"),
    ]:
        if fragment in s:
            return mapped
    return None


def infer_exam_type(source: str) -> Optional[str]:
    s = source.lower()
    if "neet" in s:
        return "NEET"
    if "advanced" in s:
        return "JEE_ADVANCED"
    if "main" in s:
        return "JEE_MAIN"
    return None


def extract_year(text: str) -> Optional[int]:
    m = re.search(r"\b(19|20)\d{2}\b", text)
    return int(m.group(0)) if m else None


def parse_year(value: Any) -> Optional[int]:
    if value is None:
        return None
    try:
        y = int(str(value).strip())
    except Exception:
        return None
    return y if 1900 <= y <= 2100 else None


def options_to_list(opts: Optional[Dict[str, Any]]) -> List[str]:
    if not isinstance(opts, dict):
        return ["", "", "", ""]
    return [str(opts.get(k) or "") for k in ("A", "B", "C", "D")]


def has_nonempty_options(opts: Optional[Dict[str, Any]]) -> bool:
    if not isinstance(opts, dict):
        return False
    return any(
        isinstance(opts.get(k), str) and opts[k].strip() for k in ("A", "B", "C", "D")
    )


def main(argv: List[str]) -> int:
    parser = argparse.ArgumentParser(
        description="Upload images to S3 and ingest questions into backend."
    )
    parser.add_argument(
        "--json", required=True, help="Path to extracted questions JSON file"
    )
    parser.add_argument("--bucket", required=True, help="S3 bucket name")
    parser.add_argument("--region", required=True, help="AWS region")
    parser.add_argument("--prefix", default="question-images", help="S3 key prefix")
    parser.add_argument(
        "--public-base-url", default=None, help="Public base URL for S3 objects"
    )
    parser.add_argument(
        "--backend-url", default="http://localhost:8080", help="Backend base URL"
    )
    parser.add_argument(
        "--api-key", default=None, help="API key sent as X-API-KEY header"
    )
    parser.add_argument(
        "--exam-type",
        default=None,
        help="Override exam type (JEE_ADVANCED|JEE_MAIN|NEET)",
    )
    parser.add_argument(
        "--default-subject",
        default=None,
        help="Fallback subject (PHYSICS|CHEMISTRY|MATHEMATICS|BIOLOGY)",
    )
    parser.add_argument("--year", type=int, default=None, help="Override year")
    parser.add_argument(
        "--dry-run", action="store_true", help="Skip S3 uploads and backend POSTs"
    )
    args = parser.parse_args(argv)

    json_path = Path(args.json).expanduser().resolve()
    if not json_path.exists():
        print(f"Error: JSON file not found: {json_path}", file=sys.stderr)
        return 1

    payload = json.loads(json_path.read_text(encoding="utf-8"))
    questions = payload.get("questions")
    if not isinstance(questions, list):
        print("Error: expected top-level 'questions' array in JSON", file=sys.stderr)
        return 1

    metadata = payload.get("metadata") or {}
    source = str(metadata.get("source") or "Unknown")

    exam_type = (
        args.exam_type.strip().upper() if args.exam_type else None
    ) or infer_exam_type(source)
    if not exam_type:
        print(
            "Error: could not infer exam type. Pass --exam-type (JEE_ADVANCED|JEE_MAIN|NEET).",
            file=sys.stderr,
        )
        return 1

    year_value = (
        args.year
        if args.year is not None
        else (parse_year(metadata.get("year")) or extract_year(source))
    )
    default_subject = (
        args.default_subject.strip().upper() if args.default_subject else None
    )

    region = (
        args.region
        or os.environ.get("AWS_REGION")
        or os.environ.get("AWS_DEFAULT_REGION")
    )
    if args.public_base_url:
        public_base_url = args.public_base_url.rstrip("/")
    elif region:
        public_base_url = f"https://{args.bucket}.s3.{region}.amazonaws.com"
    else:
        print(
            "Error: --region is required when --public-base-url is not set",
            file=sys.stderr,
        )
        return 1

    backend_url = args.backend_url.rstrip("/")
    api_key = (
        args.api_key or os.environ.get("OPENFERMI_API_KEY") or os.environ.get("API_KEY")
    )

    http_session = None
    if not args.dry_run:
        http_session = requests.Session()

    succeeded, failed = 0, 0

    for qi, q in enumerate(questions):
        if not isinstance(q, dict):
            print(f"  [{qi}] SKIP - not a valid question object")
            failed += 1
            continue

        question_text = str(q.get("question") or q.get("questionText") or "").strip()
        if not question_text:
            print(f"  [{qi}] SKIP - no question text")
            failed += 1
            continue

        q_meta = q.get("metadata") or {}
        latex_text = str(
            q.get("latexQuestion") or q.get("latexQuestionText") or question_text
        )

        # Subject
        subj_raw = str(q_meta.get("subject") or "")
        subject = map_subject(subj_raw) if subj_raw else default_subject
        if not subject:
            print(f"  [{qi}] SKIP - unmappable subject '{subj_raw}'")
            failed += 1
            continue

        # Options: prefer latexOptions if they have content
        latex_opts = q.get("latexOptions")
        plain_opts = q.get("options")
        chosen_opts = latex_opts if has_nonempty_options(latex_opts) else plain_opts
        options_list = options_to_list(chosen_opts)

        difficulty = DIFFICULTY_MAP.get(
            (q.get("difficulty") or "medium").strip().lower(), "MEDIUM"
        )

        # --- Step 1: Upload images to S3 ---
        image_urls: List[str] = []
        images = q.get("images") or []
        image_failed = False

        for img in images:
            if not isinstance(img, dict) or not img.get("path"):
                continue
            file_path = (
                Path(img["path"])
                if Path(img["path"]).is_absolute()
                else (json_path.parent / img["path"]).resolve()
            )
            if not file_path.exists():
                print(f"  [{qi}] FAIL - image not found: {file_path}")
                image_failed = True
                break

            if args.dry_run:
                image_urls.append(f"[dry-run] {file_path.name}")
            else:
                url = upload_image_to_s3(
                    s3_client, args.bucket, args.prefix, file_path, public_base_url
                )
                image_urls.append(url)

        if image_failed:
            failed += 1
            continue

        # --- Step 2: Build QuestionDto ---
        dto = QuestionDto(
            questionText=question_text,
            latexQuestionText=latex_text,
            subject=subject,
            examType=exam_type,
            difficulty=difficulty,
            options=options_list,
            imageUrls=image_urls if image_urls else None,
            year=year_value,
            paperNumber=q_meta.get("page"),
            questionNumber=q_meta.get("questionNumber"),
            topic=q_meta.get("topic"),
            metadata={
                "source": source,
                **(
                    {"exam": str(metadata.get("exam"))}
                    if metadata.get("exam") is not None
                    else {}
                ),
            },
        )

        # --- Step 3: POST to backend ---
        if args.dry_run:
            print(f"  [{qi}] DRY RUN - {subject} q#{q_meta.get('questionNumber', '?')}")
            succeeded += 1
            continue

        try:
            resp = http_session.post(
                f"{backend_url}/questions",
                json=dto.to_dict(),
                headers={
                    "Content-Type": "application/json",
                    **({"X-API-KEY": api_key} if api_key else {}),
                },
                timeout=30,
            )
            resp.raise_for_status()
            created_id = resp.json().get("data", {}).get("id")
            print(f"  [{qi}] OK - id={created_id}")
            succeeded += 1
        except Exception as e:
            print(f"  [{qi}] FAIL - {e}")
            failed += 1

    print(
        f"\nDone. Total: {len(questions)} | Succeeded: {succeeded} | Failed: {failed}"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
