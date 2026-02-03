#!/usr/bin/env python3
"""
Upload extracted question images to S3 with content-hash de-duplication,
then ingest questions into the Java backend via HTTP.

Expected input JSON format: the output produced by `npm run extract` in scripts/.

Usage:
  python3 upload_images_and_ingest.py --json path/to/file.json --bucket my-bucket
"""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import random
import re
import sys
import time
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple


try:
    # Optional convenience to load scripts/.env (not required for AWS creds).
    from dotenv import load_dotenv  # type: ignore
except Exception:  # pragma: no cover
    load_dotenv = None


def _now_iso() -> str:
    return time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())


def _load_local_env() -> None:
    if load_dotenv is None:
        return
    script_dir = Path(__file__).resolve().parent
    candidate_paths = [
        script_dir / ".env",
        script_dir.parent / ".env",
    ]
    for env_path in candidate_paths:
        if env_path.exists():
            load_dotenv(dotenv_path=str(env_path), override=False)
            break


def _normalize_aws_env() -> None:
    # Allow users who already set backend-style S3_* env vars to reuse them.
    if not os.environ.get("AWS_ACCESS_KEY_ID") and os.environ.get("S3_ACCESS_KEY_ID"):
        os.environ["AWS_ACCESS_KEY_ID"] = os.environ["S3_ACCESS_KEY_ID"]
    if not os.environ.get("AWS_SECRET_ACCESS_KEY") and os.environ.get("S3_SECRET_ACCESS_KEY"):
        os.environ["AWS_SECRET_ACCESS_KEY"] = os.environ["S3_SECRET_ACCESS_KEY"]


def _infer_region(cli_region: Optional[str]) -> Optional[str]:
    if cli_region:
        return cli_region
    return (
        os.environ.get("AWS_REGION")
        or os.environ.get("AWS_DEFAULT_REGION")
        or None
    )


def _default_public_base_url(bucket: str, region: Optional[str]) -> str:
    if not region:
        raise ValueError("Region is required to compute default public base URL (pass --region or --public-base-url)")
    return f"https://{bucket}.s3.{region}.amazonaws.com"


def _strip_trailing_slash(value: str) -> str:
    return value[:-1] if value.endswith("/") else value


def _guess_content_type_from_ext(ext: str) -> str:
    ext_l = ext.lower()
    if ext_l == ".png":
        return "image/png"
    if ext_l in (".jpg", ".jpeg"):
        return "image/jpeg"
    if ext_l == ".webp":
        return "image/webp"
    return "application/octet-stream"


def _sha256_file(path: Path, chunk_size: int = 8 * 1024 * 1024) -> str:
    h = hashlib.sha256()
    with path.open("rb") as f:
        while True:
            chunk = f.read(chunk_size)
            if not chunk:
                break
            h.update(chunk)
    return h.hexdigest()


def _sha256_bytes(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def _build_s3_key(prefix: str, hash_hex: str, ext: str) -> str:
    safe_prefix = prefix.strip("/")
    safe_ext = ext if ext.startswith(".") else f".{ext}"
    if safe_ext == ".":  # extremely defensive
        safe_ext = ".png"
    return f"{safe_prefix}/{hash_hex[:2]}/{hash_hex}{safe_ext}"


def _resolve_image_path(image_path: str, json_path: Path) -> Path:
    p = Path(image_path)
    if p.is_absolute():
        return p
    return (json_path.parent / p).resolve()


def _extract_first_year(text: str) -> Optional[int]:
    m = re.search(r"\b(19|20)\d{2}\b", text)
    if not m:
        return None
    try:
        return int(m.group(0))
    except Exception:
        return None


def _infer_exam_type(source: str) -> Optional[str]:
    s = source.lower()
    if "neet" in s:
        return "NEET"
    if "advanced" in s:
        return "JEE_ADVANCED"
    if re.search(r"\bjee\s*main\b", s) or " jee main" in s or "main" in s:
        # The last "main" check is intentionally broad; override with --exam-type if ambiguous.
        return "JEE_MAIN"
    return None


def _map_subject(subject: str) -> Optional[str]:
    s = subject.strip().lower()
    if not s:
        return None
    if s in ("math", "maths", "mathematics"):
        return "MATHEMATICS"
    if s == "physics":
        return "PHYSICS"
    if s == "chemistry":
        return "CHEMISTRY"
    if s == "biology":
        return "BIOLOGY"
    # Handle common variants from extraction
    if "math" in s:
        return "MATHEMATICS"
    if "phys" in s:
        return "PHYSICS"
    if "chem" in s:
        return "CHEMISTRY"
    if "bio" in s:
        return "BIOLOGY"
    return None


def _map_difficulty(difficulty: Optional[str]) -> str:
    if not difficulty:
        return "MEDIUM"
    d = difficulty.strip().lower()
    if d == "easy":
        return "EASY"
    if d == "hard":
        return "HARD"
    return "MEDIUM"


def _options_to_list(options_obj: Optional[Dict[str, Any]]) -> List[str]:
    if not isinstance(options_obj, dict):
        return ["", "", "", ""]
    return [
        str(options_obj.get("A") or ""),
        str(options_obj.get("B") or ""),
        str(options_obj.get("C") or ""),
        str(options_obj.get("D") or ""),
    ]


def _has_any_nonempty_option(options_obj: Optional[Dict[str, Any]]) -> bool:
    if not isinstance(options_obj, dict):
        return False
    for k in ("A", "B", "C", "D"):
        v = options_obj.get(k)
        if isinstance(v, str) and v.strip():
            return True
    return False


def _parse_data_uri(data_uri: str) -> Tuple[str, bytes]:
    # Minimal parser for data URIs like: data:image/png;base64,....
    if not data_uri.startswith("data:"):
        raise ValueError("Not a data URI")
    try:
        header, b64 = data_uri.split(",", 1)
    except ValueError as e:
        raise ValueError("Invalid data URI format") from e
    # header: data:<mime>;base64
    if ";base64" not in header:
        raise ValueError("Only base64 data URIs are supported")
    mime = header[5:].split(";", 1)[0].strip() or "application/octet-stream"
    import base64

    return mime, base64.b64decode(b64)


@dataclass
class UploadedImage:
    hash: str
    key: str
    url: str
    status: str  # "uploaded" | "exists" | "dry_run" | "error"
    skipped_upload: bool
    error: Optional[str] = None
    source_paths: Optional[List[str]] = None


def _sleep_backoff(attempt: int) -> None:
    base = 1.0 * (2**attempt)
    jitter = random.random() * 0.25
    time.sleep(base + jitter)


def _request_with_retry(session, method: str, url: str, *, headers: Dict[str, str], json_body: Any, timeout_s: int) -> Any:
    import requests

    last_exc: Optional[Exception] = None
    for attempt in range(0, 3):
        try:
            resp = session.request(
                method,
                url,
                headers=headers,
                json=json_body,
                timeout=timeout_s,
            )
        except Exception as e:
            last_exc = e
            if attempt < 2:
                _sleep_backoff(attempt)
                continue
            raise

        if resp.status_code == 429 or resp.status_code >= 500:
            if attempt < 2:
                _sleep_backoff(attempt)
                continue
        if resp.status_code >= 400:
            # Surface response text for debugging
            raise requests.HTTPError(
                f"HTTP {resp.status_code} for {method} {url}: {resp.text[:500]}",
                response=resp,
            )
        try:
            return resp.json()
        except Exception:
            return {"_raw": resp.text}
    if last_exc:
        raise last_exc
    raise RuntimeError("Unreachable")


def _s3_head_object(s3_client, bucket: str, key: str) -> bool:
    from botocore.exceptions import ClientError

    try:
        s3_client.head_object(Bucket=bucket, Key=key)
        return True
    except ClientError as e:
        code = str(e.response.get("Error", {}).get("Code", ""))
        if code in ("404", "NoSuchKey", "NotFound"):
            return False
        raise


def _s3_upload_file(
    s3_client,
    *,
    bucket: str,
    key: str,
    file_path: Path,
    content_type: str,
    cache_control: str,
) -> None:
    s3_client.upload_file(
        Filename=str(file_path),
        Bucket=bucket,
        Key=key,
        ExtraArgs={
            "ContentType": content_type,
            "CacheControl": cache_control,
        },
    )


def _s3_put_bytes(
    s3_client,
    *,
    bucket: str,
    key: str,
    data: bytes,
    content_type: str,
    cache_control: str,
) -> None:
    s3_client.put_object(
        Bucket=bucket,
        Key=key,
        Body=data,
        ContentType=content_type,
        CacheControl=cache_control,
    )


def main(argv: List[str]) -> int:
    parser = argparse.ArgumentParser(description="Upload question images to S3 (dedup by sha256) and ingest questions into backend.")
    parser.add_argument("--json", required=True, help="Path to extracted questions JSON file")
    parser.add_argument("--bucket", required=True, help="S3 bucket name")
    parser.add_argument("--prefix", default="question-images", help="S3 key prefix (default: question-images)")
    parser.add_argument("--region", default=None, help="AWS region (optional; used for S3 client + default public URL)")
    parser.add_argument("--public-base-url", default=None, help="Public base URL (e.g. https://dxxxx.cloudfront.net). If omitted, defaults to https://{bucket}.s3.{region}.amazonaws.com")
    parser.add_argument("--backend-url", default="http://localhost:8080", help="Backend base URL (default: http://localhost:8080)")
    parser.add_argument("--api-key", default=None, help="Optional API key to send as X-API-KEY (or set OPENFERMI_API_KEY/API_KEY env var)")
    parser.add_argument("--exam-type", default=None, help="Override examType (JEE_ADVANCED|JEE_MAIN|NEET). Required if cannot infer.")
    parser.add_argument("--default-subject", default=None, help="Default subject if per-question subject missing (PHYSICS|CHEMISTRY|MATHEMATICS|BIOLOGY)")
    parser.add_argument("--year", type=int, default=None, help="Override year (int)")
    parser.add_argument("--dry-run", action="store_true", help="No S3 uploads and no backend POSTs; still computes keys/URLs and writes report.")
    parser.add_argument("--write-updated-json", action="store_true", help="Write <jsonPath>.s3.json with images[].path replaced by uploaded URL.")
    parser.add_argument("--timeout", type=int, default=30, help="HTTP timeout seconds (default: 30)")

    args = parser.parse_args(argv)

    _load_local_env()
    _normalize_aws_env()

    json_path = Path(args.json).expanduser().resolve()
    if not json_path.exists():
        print(f"Error: JSON file not found: {json_path}", file=sys.stderr)
        return 2

    with json_path.open("r", encoding="utf-8") as f:
        try:
            payload = json.load(f)
        except Exception as e:
            print(f"Error: failed to parse JSON: {e}", file=sys.stderr)
            return 2

    questions = payload.get("questions")
    if not isinstance(questions, list):
        print("Error: invalid input JSON: expected top-level 'questions' array", file=sys.stderr)
        return 2

    source = ""
    metadata = payload.get("metadata")
    if isinstance(metadata, dict):
        source = str(metadata.get("source") or "")
    if not source and questions:
        q0_meta = questions[0].get("metadata") if isinstance(questions[0], dict) else None
        if isinstance(q0_meta, dict):
            source = str(q0_meta.get("source") or "")
    source = source.strip() or "Unknown"

    region = _infer_region(args.region)

    if args.public_base_url:
        public_base_url = _strip_trailing_slash(str(args.public_base_url))
    else:
        try:
            public_base_url = _default_public_base_url(args.bucket, region)
        except Exception as e:
            print(f"Error: {e}", file=sys.stderr)
            return 2

    api_key = args.api_key or os.environ.get("OPENFERMI_API_KEY") or os.environ.get("API_KEY") or os.environ.get("X_API_KEY")
    backend_url = _strip_trailing_slash(str(args.backend_url))

    exam_type_override = args.exam_type.strip().upper() if args.exam_type else None
    allowed_exam_types = {"JEE_ADVANCED", "JEE_MAIN", "NEET"}
    if exam_type_override and exam_type_override not in allowed_exam_types:
        print(f"Error: invalid --exam-type: {exam_type_override}. Expected one of {sorted(allowed_exam_types)}", file=sys.stderr)
        return 2

    default_subject_override = args.default_subject.strip().upper() if args.default_subject else None
    allowed_subjects = {"PHYSICS", "CHEMISTRY", "MATHEMATICS", "BIOLOGY"}
    if default_subject_override and default_subject_override not in allowed_subjects:
        print(f"Error: invalid --default-subject: {default_subject_override}. Expected one of {sorted(allowed_subjects)}", file=sys.stderr)
        return 2

    inferred_exam_type = _infer_exam_type(source)
    exam_type = exam_type_override or inferred_exam_type
    if not exam_type:
        print(
            "Error: could not infer exam type from metadata.source. Pass --exam-type (JEE_ADVANCED|JEE_MAIN|NEET).",
            file=sys.stderr,
        )
        return 2

    year_value = args.year if args.year is not None else _extract_first_year(source)

    # Lazy imports so dry-run can still work without AWS deps if desired.
    s3_client = None
    if not args.dry_run:
        try:
            import boto3  # type: ignore

            session = boto3.session.Session(region_name=region)
            s3_client = session.client("s3")
            # If region was not explicitly set, attempt to derive it for URL generation.
            if not region:
                region = session.region_name or region
        except Exception as e:
            print(f"Error: failed to initialize boto3 S3 client: {e}", file=sys.stderr)
            return 2

    report: Dict[str, Any] = {
        "startedAt": _now_iso(),
        "finishedAt": None,
        "inputJson": str(json_path),
        "source": source,
        "bucket": args.bucket,
        "prefix": args.prefix,
        "region": region,
        "publicBaseUrl": public_base_url,
        "backendUrl": backend_url,
        "dryRun": bool(args.dry_run),
        "totals": {
            "questions": len(questions),
            "succeeded": 0,
            "failed": 0,
            "skipped": 0,
            "imagesReferenced": 0,
            "imagesUploaded": 0,
            "imagesSkippedExisting": 0,
        },
        "images": [],
        "questions": [],
    }

    image_cache: Dict[str, UploadedImage] = {}
    image_index: Dict[str, int] = {}  # hash -> index in report["images"]

    def record_image(img: UploadedImage) -> None:
        if img.hash in image_index:
            idx = image_index[img.hash]
            existing = report["images"][idx]
            paths = existing.get("sourcePaths") or []
            if img.source_paths:
                for p in img.source_paths:
                    if p not in paths:
                        paths.append(p)
            existing["sourcePaths"] = paths
            return
        image_index[img.hash] = len(report["images"])
        report["images"].append(
            {
                "hash": img.hash,
                "key": img.key,
                "url": img.url,
                "status": img.status,
                "skippedUpload": img.skipped_upload,
                "error": img.error,
                "sourcePaths": img.source_paths or [],
            }
        )

    def ensure_uploaded_from_path(image_path_str: str) -> UploadedImage:
        resolved = _resolve_image_path(image_path_str, json_path)
        if not resolved.exists():
            return UploadedImage(
                hash="",
                key="",
                url="",
                status="error",
                skipped_upload=True,
                error=f"Image file not found: {resolved}",
                source_paths=[image_path_str],
            )

        ext = resolved.suffix.lower() or ".png"
        content_type = _guess_content_type_from_ext(ext)
        cache_control = "public, max-age=31536000, immutable"

        hash_hex = _sha256_file(resolved)
        key = _build_s3_key(args.prefix, hash_hex, ext)
        url = f"{public_base_url}/{key}"

        if hash_hex in image_cache:
            cached = image_cache[hash_hex]
            if cached.source_paths is None:
                cached.source_paths = []
            if image_path_str not in cached.source_paths:
                cached.source_paths.append(image_path_str)
            return cached

        if args.dry_run:
            img = UploadedImage(
                hash=hash_hex,
                key=key,
                url=url,
                status="dry_run",
                skipped_upload=True,
                source_paths=[image_path_str],
            )
            image_cache[hash_hex] = img
            record_image(img)
            return img

        assert s3_client is not None
        try:
            exists = _s3_head_object(s3_client, args.bucket, key)
            if exists:
                img = UploadedImage(
                    hash=hash_hex,
                    key=key,
                    url=url,
                    status="exists",
                    skipped_upload=True,
                    source_paths=[image_path_str],
                )
                report["totals"]["imagesSkippedExisting"] += 1
            else:
                _s3_upload_file(
                    s3_client,
                    bucket=args.bucket,
                    key=key,
                    file_path=resolved,
                    content_type=content_type,
                    cache_control=cache_control,
                )
                img = UploadedImage(
                    hash=hash_hex,
                    key=key,
                    url=url,
                    status="uploaded",
                    skipped_upload=False,
                    source_paths=[image_path_str],
                )
                report["totals"]["imagesUploaded"] += 1
        except Exception as e:
            img = UploadedImage(
                hash=hash_hex,
                key=key,
                url=url,
                status="error",
                skipped_upload=True,
                error=str(e),
                source_paths=[image_path_str],
            )

        image_cache[hash_hex] = img
        record_image(img)
        return img

    def ensure_uploaded_from_data_uri(data_uri: str) -> UploadedImage:
        try:
            mime, data = _parse_data_uri(data_uri)
        except Exception as e:
            return UploadedImage(
                hash="",
                key="",
                url="",
                status="error",
                skipped_upload=True,
                error=f"Invalid data URI: {e}",
                source_paths=[],
            )

        ext = ".png"
        if mime == "image/jpeg":
            ext = ".jpg"
        elif mime == "image/webp":
            ext = ".webp"
        elif mime == "image/png":
            ext = ".png"

        hash_hex = _sha256_bytes(data)
        key = _build_s3_key(args.prefix, hash_hex, ext)
        url = f"{public_base_url}/{key}"

        if hash_hex in image_cache:
            return image_cache[hash_hex]

        if args.dry_run:
            img = UploadedImage(hash=hash_hex, key=key, url=url, status="dry_run", skipped_upload=True, source_paths=[])
            image_cache[hash_hex] = img
            record_image(img)
            return img

        assert s3_client is not None
        content_type = mime
        cache_control = "public, max-age=31536000, immutable"
        try:
            exists = _s3_head_object(s3_client, args.bucket, key)
            if exists:
                img = UploadedImage(hash=hash_hex, key=key, url=url, status="exists", skipped_upload=True, source_paths=[])
                report["totals"]["imagesSkippedExisting"] += 1
            else:
                _s3_put_bytes(
                    s3_client,
                    bucket=args.bucket,
                    key=key,
                    data=data,
                    content_type=content_type,
                    cache_control=cache_control,
                )
                img = UploadedImage(hash=hash_hex, key=key, url=url, status="uploaded", skipped_upload=False, source_paths=[])
                report["totals"]["imagesUploaded"] += 1
        except Exception as e:
            img = UploadedImage(hash=hash_hex, key=key, url=url, status="error", skipped_upload=True, error=str(e), source_paths=[])
        image_cache[hash_hex] = img
        record_image(img)
        return img

    # Prepare HTTP session if not dry-run
    http_session = None
    if not args.dry_run:
        try:
            import requests

            http_session = requests.Session()
        except Exception as e:
            print(f"Error: failed to import requests: {e}", file=sys.stderr)
            return 2

    updated_payload = None
    if args.write_updated_json:
        # Deep-copy-ish for JSON-serializable content
        updated_payload = json.loads(json.dumps(payload))

    print("Starting upload + ingest")
    print(f"  Input JSON: {json_path}")
    print(f"  Source: {source}")
    print(f"  Bucket: {args.bucket}")
    print(f"  Prefix: {args.prefix}")
    print(f"  Public base URL: {public_base_url}")
    print(f"  Backend: {backend_url}")
    print(f"  Exam type: {exam_type}")
    if default_subject_override:
        print(f"  Default subject: {default_subject_override}")
    if year_value is not None:
        print(f"  Year: {year_value}")
    if args.dry_run:
        print("  Dry run: true (no S3 uploads, no backend POSTs)")
    print("")

    for qi, q in enumerate(questions):
        if not isinstance(q, dict):
            report["totals"]["failed"] += 1
            report["questions"].append({"index": qi, "status": "error", "error": "Invalid question entry (expected object)"})
            continue

        script_qid = str(q.get("id") or "")
        q_meta = q.get("metadata") if isinstance(q.get("metadata"), dict) else {}

        question_text = str(q.get("question") or q.get("questionText") or "").strip()
        latex_question_text = str(q.get("latexQuestion") or q.get("latexQuestionText") or question_text)

        if not question_text:
            report["totals"]["failed"] += 1
            report["questions"].append(
                {
                    "scriptQuestionId": script_qid,
                    "index": qi,
                    "status": "error",
                    "error": "Missing question text",
                }
            )
            continue

        difficulty = _map_difficulty(q.get("difficulty") if isinstance(q.get("difficulty"), str) else None)

        options_obj = q.get("options") if isinstance(q.get("options"), dict) else None
        latex_options_obj = q.get("latexOptions") if isinstance(q.get("latexOptions"), dict) else None
        chosen_options = latex_options_obj if _has_any_nonempty_option(latex_options_obj) else options_obj
        options_list = _options_to_list(chosen_options)

        page_num = q_meta.get("page") if isinstance(q_meta, dict) else None
        question_number = q_meta.get("questionNumber") if isinstance(q_meta, dict) else None
        topic = q_meta.get("topic") if isinstance(q_meta, dict) else None

        subj_raw = str(q_meta.get("subject") or "") if isinstance(q_meta, dict) else ""
        subject = _map_subject(subj_raw) if subj_raw else None
        if not subject and default_subject_override:
            subject = default_subject_override

        if not subject:
            report["totals"]["failed"] += 1
            report["questions"].append(
                {
                    "scriptQuestionId": script_qid,
                    "index": qi,
                    "status": "error",
                    "error": f"Missing/unmappable subject (value={subj_raw!r}). Pass --default-subject or fix extraction.",
                }
            )
            continue

        images = q.get("images") if isinstance(q.get("images"), list) else []
        uploaded_urls: List[str] = []
        uploaded_details: List[Dict[str, Any]] = []
        image_error: Optional[str] = None

        for img_idx, img in enumerate(images):
            if not isinstance(img, dict):
                report["totals"]["imagesReferenced"] += 1
                image_error = f"Invalid image entry at index {img_idx} (expected object)"
                break
            report["totals"]["imagesReferenced"] += 1

            img_path = img.get("path")
            img_data = img.get("data")

            upload_res: UploadedImage
            if isinstance(img_path, str) and img_path.strip():
                upload_res = ensure_uploaded_from_path(img_path.strip())
            elif isinstance(img_data, str) and img_data.strip().startswith("data:"):
                upload_res = ensure_uploaded_from_data_uri(img_data.strip())
            else:
                upload_res = UploadedImage(
                    hash="",
                    key="",
                    url="",
                    status="error",
                    skipped_upload=True,
                    error="Image missing both 'path' and base64 'data'",
                    source_paths=[],
                )

            if upload_res.status == "error":
                image_error = upload_res.error or "Unknown image upload error"
                uploaded_details.append(
                    {
                        "index": img_idx,
                        "status": "error",
                        "error": upload_res.error,
                        "path": img_path,
                        "hash": upload_res.hash,
                        "key": upload_res.key,
                        "url": upload_res.url,
                    }
                )
                break

            uploaded_urls.append(upload_res.url)
            uploaded_details.append(
                {
                    "index": img_idx,
                    "status": upload_res.status,
                    "skippedUpload": upload_res.skipped_upload,
                    "path": img_path,
                    "hash": upload_res.hash,
                    "key": upload_res.key,
                    "url": upload_res.url,
                }
            )

            if args.write_updated_json and updated_payload is not None:
                try:
                    updated_payload["questions"][qi]["images"][img_idx]["path"] = upload_res.url
                except Exception:
                    pass

        if image_error:
            report["totals"]["failed"] += 1
            report["questions"].append(
                {
                    "scriptQuestionId": script_qid,
                    "index": qi,
                    "status": "error",
                    "error": f"Image upload failed: {image_error}",
                    "images": uploaded_details,
                }
            )
            continue

        dto_metadata: Dict[str, str] = {
            "source": source,
        }
        if script_qid:
            dto_metadata["scriptQuestionId"] = script_qid
        is_multi_part = q_meta.get("isMultiPart") if isinstance(q_meta, dict) else None
        if isinstance(is_multi_part, bool):
            dto_metadata["isMultiPart"] = "true" if is_multi_part else "false"

        # Helpful traceability: include image hashes
        for i, det in enumerate(uploaded_details):
            h = det.get("hash")
            if isinstance(h, str) and h:
                dto_metadata[f"imageHash{i}"] = h

        dto: Dict[str, Any] = {
            "questionText": question_text,
            "latexQuestionText": latex_question_text,
            "subject": subject,
            "examType": exam_type,
            "difficulty": difficulty,
            "options": options_list,
            "imageUrls": uploaded_urls,
            "year": year_value,
            "paperNumber": page_num,
            "questionNumber": question_number,
            "topic": topic,
            "isActive": True,
            "metadata": dto_metadata,
        }

        if args.dry_run:
            report["totals"]["skipped"] += 1
            report["questions"].append(
                {
                    "scriptQuestionId": script_qid,
                    "index": qi,
                    "status": "dry_run",
                    "dto": dto,
                    "images": uploaded_details,
                }
            )
            if (qi + 1) % 10 == 0:
                print(f"  Processed {qi + 1}/{len(questions)} questions (dry-run)")
            continue

        assert http_session is not None
        url = f"{backend_url}/questions"
        headers: Dict[str, str] = {"Content-Type": "application/json"}
        if api_key:
            headers["X-API-KEY"] = api_key

        try:
            resp_json = _request_with_retry(
                http_session,
                "POST",
                url,
                headers=headers,
                json_body=dto,
                timeout_s=int(args.timeout),
            )
            created_id = None
            if isinstance(resp_json, dict):
                data = resp_json.get("data")
                if isinstance(data, dict):
                    created_id = data.get("id")
            report["totals"]["succeeded"] += 1
            report["questions"].append(
                {
                    "scriptQuestionId": script_qid,
                    "index": qi,
                    "status": "success",
                    "createdId": created_id,
                    "images": uploaded_details,
                }
            )
        except Exception as e:
            report["totals"]["failed"] += 1
            report["questions"].append(
                {
                    "scriptQuestionId": script_qid,
                    "index": qi,
                    "status": "error",
                    "error": str(e),
                    "images": uploaded_details,
                }
            )

        if (qi + 1) % 10 == 0:
            print(f"  Processed {qi + 1}/{len(questions)} questions")

    report["finishedAt"] = _now_iso()

    report_path = Path(str(json_path) + ".ingest-report.json")
    with report_path.open("w", encoding="utf-8") as f:
        json.dump(report, f, indent=2)
        f.write("\n")

    if args.write_updated_json and updated_payload is not None:
        updated_path = Path(str(json_path) + ".s3.json")
        with updated_path.open("w", encoding="utf-8") as f:
            json.dump(updated_payload, f, indent=2)
            f.write("\n")
        print(f"\nWrote updated JSON: {updated_path}")

    print("\nDone")
    print(f"  Report: {report_path}")
    print(f"  Questions total: {report['totals']['questions']}")
    print(f"  Succeeded: {report['totals']['succeeded']}")
    print(f"  Failed: {report['totals']['failed']}")
    print(f"  Skipped: {report['totals']['skipped']}")
    print(f"  Images referenced: {report['totals']['imagesReferenced']}")
    print(f"  Images uploaded: {report['totals']['imagesUploaded']}")
    print(f"  Images existed: {report['totals']['imagesSkippedExisting']}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
