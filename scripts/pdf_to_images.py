#!/usr/bin/env python3
"""
Convert PDF pages to PNG images
"""
import sys
import os
from pathlib import Path
try:
    from pdf2image import convert_from_path
except ImportError:
    print("Error: pdf2image not installed. Run: pip install pdf2image")
    print("You may also need: brew install poppler (on macOS) or apt-get install poppler-utils (on Linux)")
    sys.exit(1)


def pdf_to_images(pdf_path: str, output_dir: str, dpi: int = 300):
    """
    Convert PDF pages to PNG images
    
    Args:
        pdf_path: Path to PDF file
        output_dir: Directory to save images
        dpi: Resolution for images (default 300)
    
    Returns:
        List of image file paths
    """
    # Create output directory if it doesn't exist
    os.makedirs(output_dir, exist_ok=True)
    
    # Get PDF filename without extension
    pdf_name = Path(pdf_path).stem
    
    print(f"Converting {pdf_path} to images...")
    print(f"Output directory: {output_dir}")
    print(f"DPI: {dpi}")
    
    try:
        # Convert PDF to images
        images = convert_from_path(pdf_path, dpi=dpi)
        
        image_paths = []
        for i, image in enumerate(images, start=1):
            # Save as PNG
            image_filename = f"{pdf_name}_page_{i:03d}.png"
            image_path = os.path.join(output_dir, image_filename)
            image.save(image_path, 'PNG')
            image_paths.append(image_path)
            print(f"  Page {i}/{len(images)}: {image_path}")
        
        print(f"\n✓ Converted {len(images)} pages to images")
        return image_paths
        
    except Exception as e:
        print(f"Error converting PDF: {e}")
        sys.exit(1)


if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python pdf_to_images.py <pdf_path> <output_dir> [dpi]")
        print("Example: python pdf_to_images.py paper.pdf ./images 300")
        sys.exit(1)
    
    pdf_path = sys.argv[1]
    output_dir = sys.argv[2]
    dpi = int(sys.argv[3]) if len(sys.argv) > 3 else 300
    
    if not os.path.exists(pdf_path):
        print(f"Error: PDF file not found: {pdf_path}")
        sys.exit(1)
    
    pdf_to_images(pdf_path, output_dir, dpi)
