import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface PageImage {
  pageNumber: number;
  imagePath: string;
  base64: string;
}

const SUPPORTED_IMAGE_FORMATS = ['.png', '.jpg', '.jpeg', '.webp'] as const;
const MIME_TYPES: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
};

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

export async function convertPDFToImages(
  pdfPath: string,
  outputDir: string,
  dpi: number = 300
): Promise<PageImage[]> {
  ensureDirectoryExists(outputDir);

  const scriptDir = path.dirname(__dirname);
  const pythonScript = path.join(scriptDir, 'pdf_to_images.py');

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
