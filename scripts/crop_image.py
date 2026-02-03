#!/usr/bin/env python3
"""
Crop an image using a normalized bounding box (0..1) with optional padding.

Usage:
  python3 crop_image.py <input_path> <output_path> <left> <top> <right> <bottom> [pad_pct]

Notes:
  - Normalized coordinates are relative to the input image size:
      (0,0) = top-left, (1,1) = bottom-right
  - pad_pct is applied as a fraction of the bbox width/height (default: 0.02)
"""

from __future__ import annotations

import math
import os
import sys
from pathlib import Path

from PIL import Image


def clamp(value: float, lo: float, hi: float) -> float:
    return max(lo, min(hi, value))


def parse_float(value: str, name: str) -> float:
    try:
        return float(value)
    except ValueError:
        raise ValueError(f"Invalid {name}: {value!r}")


def normalized_to_pixels(
    width: int,
    height: int,
    left: float,
    top: float,
    right: float,
    bottom: float,
    pad_pct: float,
) -> tuple[int, int, int, int]:
    left_n = clamp(left, 0.0, 1.0)
    top_n = clamp(top, 0.0, 1.0)
    right_n = clamp(right, 0.0, 1.0)
    bottom_n = clamp(bottom, 0.0, 1.0)

    if right_n <= left_n or bottom_n <= top_n:
        raise ValueError("Invalid bbox after clamping (right<=left or bottom<=top)")

    x0 = int(math.floor(left_n * width))
    y0 = int(math.floor(top_n * height))
    x1 = int(math.ceil(right_n * width))
    y1 = int(math.ceil(bottom_n * height))

    x0 = max(0, min(width, x0))
    y0 = max(0, min(height, y0))
    x1 = max(0, min(width, x1))
    y1 = max(0, min(height, y1))

    bbox_w = max(0, x1 - x0)
    bbox_h = max(0, y1 - y0)
    if bbox_w < 2 or bbox_h < 2:
        raise ValueError("Invalid bbox after rounding (bbox too small)")

    pad_pct_c = clamp(pad_pct, 0.0, 0.5)
    pad_x = int(round(bbox_w * pad_pct_c))
    pad_y = int(round(bbox_h * pad_pct_c))

    x0_p = max(0, x0 - pad_x)
    y0_p = max(0, y0 - pad_y)
    x1_p = min(width, x1 + pad_x)
    y1_p = min(height, y1 + pad_y)

    if x1_p <= x0_p or y1_p <= y0_p or (x1_p - x0_p) < 2 or (y1_p - y0_p) < 2:
        raise ValueError("Invalid crop region after padding (region too small)")

    return x0_p, y0_p, x1_p, y1_p


def ensure_parent_dir(path: Path) -> None:
    parent = path.parent
    os.makedirs(parent, exist_ok=True)


def main(argv: list[str]) -> int:
    if len(argv) < 7:
        print(
            "Usage: python3 crop_image.py <input_path> <output_path> <left> <top> <right> <bottom> [pad_pct]",
            file=sys.stderr,
        )
        return 2

    input_path = Path(argv[1])
    output_path = Path(argv[2])

    try:
        left = parse_float(argv[3], "left")
        top = parse_float(argv[4], "top")
        right = parse_float(argv[5], "right")
        bottom = parse_float(argv[6], "bottom")
        pad_pct = parse_float(argv[7], "pad_pct") if len(argv) >= 8 else 0.02
    except ValueError as e:
        print(f"Error: {e}", file=sys.stderr)
        return 2

    if not input_path.exists():
        print(f"Error: input image not found: {str(input_path)}", file=sys.stderr)
        return 2

    try:
        with Image.open(input_path) as im:
            im.load()
            width, height = im.size
            x0, y0, x1, y1 = normalized_to_pixels(width, height, left, top, right, bottom, pad_pct)
            cropped = im.crop((x0, y0, x1, y1))
            ensure_parent_dir(output_path)
            cropped.save(output_path, format="PNG")
    except Exception as e:
        print(f"Error: failed to crop image: {e}", file=sys.stderr)
        return 1

    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv))

