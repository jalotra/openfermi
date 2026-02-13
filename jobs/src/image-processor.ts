import fs from 'fs';
import path from 'path';
import { execFileSync, execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const scriptsDir = path.dirname(__dirname);
const pythonHelpersDir = path.join(scriptsDir, 'python');

function resolvePythonHelper(scriptName: string): string {
  const fullPath = path.join(pythonHelpersDir, scriptName);
  if (!fs.existsSync(fullPath)) {
    throw new Error(`Missing python helper at ${fullPath} (expected under scripts/python/).`);
  }
  return fullPath;
}

export interface PageImage {
  pageNumber: number;
  imagePath: string;
  base64: string;
}

export interface NormalizedBBox {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

const MIME_TYPES: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
};

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(1, value));
}

function sanitizeBBox(bbox?: NormalizedBBox): NormalizedBBox {
  if (!bbox) {
    return { left: 0, top: 0, right: 1, bottom: 1 };
  }

  const left = clamp01(bbox.left);
  const top = clamp01(bbox.top);
  const right = clamp01(bbox.right);
  const bottom = clamp01(bbox.bottom);

  if (right <= left || bottom <= top) {
    return { left: 0, top: 0, right: 1, bottom: 1 };
  }

  return { left, top, right, bottom };
}

function getMimeType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  return MIME_TYPES[ext] || 'image/png';
}

function ensureDirectoryExists(dirPath: string): void {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function extractPageNumber(filename: string, currentIndex: number): number {
  const match = filename.match(/_page_(\d+)\.png$/);
  return match ? parseInt(match[1], 10) : currentIndex + 1;
}

function convertImageToBase64(imagePath: string): string {
  const imageBuffer = fs.readFileSync(imagePath);
  const base64 = imageBuffer.toString('base64');
  const mimeType = getMimeType(imagePath);
  return `data:${mimeType};base64,${base64}`;
}

export function cropImageNormalized(
  inputImagePath: string,
  outputImagePath: string,
  bbox?: NormalizedBBox,
  options: { padPct?: number } = {}
): void {
  const padPct = options.padPct ?? 0.02;
  const sanitized = sanitizeBBox(bbox);

  const pythonScript = resolvePythonHelper('crop_image.py');

  ensureDirectoryExists(path.dirname(outputImagePath));

  try {
    execFileSync(
      'python3',
      [
        pythonScript,
        inputImagePath,
        outputImagePath,
        String(sanitized.left),
        String(sanitized.top),
        String(sanitized.right),
        String(sanitized.bottom),
        String(padPct),
      ],
      { stdio: 'inherit' }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to crop image: ${message}`);
  }
}

export async function convertPDFToImages(
  pdfPath: string,
  outputDir: string,
  dpi: number = 300
): Promise<PageImage[]> {
  ensureDirectoryExists(outputDir);

  const pythonScript = resolvePythonHelper('pdf_to_images.py');

  console.log(` Converting PDF to images using Python...`);
  console.log(`  PDF: ${pdfPath}`);
  console.log(`  Output: ${outputDir}`);
  console.log(`  DPI: ${dpi}`);

  try {
    const pythonCmd = `python3 "${pythonScript}" "${pdfPath}" "${outputDir}" ${dpi}`;
    execSync(pythonCmd, { stdio: 'inherit' });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to convert PDF to images: ${message}`);
  }

  const imageFiles = fs
    .readdirSync(outputDir)
    .filter(file => file.endsWith('.png'))
    .sort();

  const pageImages: PageImage[] = imageFiles.map((imageFile, index) => {
    const imagePath = path.join(outputDir, imageFile);
    const pageNumber = extractPageNumber(imageFile, index);
    const base64 = convertImageToBase64(imagePath);

    return {
      pageNumber,
      imagePath,
      base64,
    };
  });

  console.log(`✓ Loaded ${pageImages.length} page images\n`);
  return pageImages;
}

export async function loadSingleImage(
  imagePath: string,
  pageNumber: number = 1
): Promise<PageImage> {
  if (!fs.existsSync(imagePath)) {
    throw new Error(`Image file not found: ${imagePath}`);
  }

  const base64 = convertImageToBase64(imagePath);

  return {
    pageNumber,
    imagePath,
    base64,
  };
}
