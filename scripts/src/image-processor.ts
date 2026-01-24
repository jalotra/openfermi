import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

export interface PageImage {
  pageNumber: number;
  imagePath: string;
  base64: string;
}

/**
 * Convert PDF to PNG images using Python script
 */
export async function convertPDFToImages(
  pdfPath: string,
  outputDir: string,
  dpi: number = 300
): Promise<PageImage[]> {
  // Ensure output directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const scriptDir = path.dirname(path.dirname(__filename || __dirname));
  const pythonScript = path.join(scriptDir, 'pdf_to_images.py');

  console.log(` Converting PDF to images using Python...`);
  console.log(`  PDF: ${pdfPath}`);
  console.log(`  Output: ${outputDir}`);
  console.log(`  DPI: ${dpi}`);

  try {
    // Run Python script
    const pythonCmd = `python3 "${pythonScript}" "${pdfPath}" "${outputDir}" ${dpi}`;
    execSync(pythonCmd, { stdio: 'inherit' });
  } catch (error: any) {
    throw new Error(`Failed to convert PDF to images: ${error.message}`);
  }

  // Read all PNG files and convert to base64
  const imageFiles = fs.readdirSync(outputDir)
    .filter(file => file.endsWith('.png'))
    .sort(); // Sort to ensure correct page order

  const pageImages: PageImage[] = [];

  for (const imageFile of imageFiles) {
    // Extract page number from filename (format: name_page_001.png)
    const match = imageFile.match(/_page_(\d+)\.png$/);
    const pageNumber = match ? parseInt(match[1], 10) : pageImages.length + 1;

    const imagePath = path.join(outputDir, imageFile);
    const imageBuffer = fs.readFileSync(imagePath);
    const base64 = imageBuffer.toString('base64');
    const mimeType = 'image/png';
    const base64WithPrefix = `data:${mimeType};base64,${base64}`;

    pageImages.push({
      pageNumber,
      imagePath,
      base64: base64WithPrefix
    });
  }

  console.log(`✓ Loaded ${pageImages.length} page images\n`);
  return pageImages;
}
