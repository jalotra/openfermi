import fs from 'fs';
import path from 'path';
import pdf from 'pdf-parse';
import { createCanvas, loadImage } from 'canvas';

export interface ExtractedPage {
  pageNumber: number;
  text: string;
  images: ExtractedImage[];
}

export interface ExtractedImage {
  data: Buffer;
  format: string; // 'png', 'jpeg', etc.
  width: number;
  height: number;
  base64: string; // Base64 encoded for AI vision models
}

/**
 * Extract text and images from a PDF file
 */
export async function extractFromPDF(pdfPath: string): Promise<ExtractedPage[]> {
  const pdfBuffer = fs.readFileSync(pdfPath);
  const pdfData = await pdf(pdfBuffer);
  
  // Extract text using pdf-parse
  const pages: ExtractedPage[] = [];
  const totalPages = pdfData.numpages;
  
  // Try to use pdfjs for per-page text and image extraction
  let pdfjsLib: any;
  let pdfDocument: any;
  
  try {
    // Dynamic import for pdfjs-dist legacy build (for Node.js)
    const pdfjsModule = await import('pdfjs-dist/legacy/build/pdf.mjs');
    pdfjsLib = pdfjsModule;
    
    // Set up worker if needed
    if (pdfjsLib.GlobalWorkerOptions) {
      pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
    }
    
    const loadingTask = pdfjsLib.getDocument({ data: pdfBuffer });
    pdfDocument = await loadingTask.promise;
  } catch (error) {
    console.warn('pdfjs-dist not available, using pdf-parse text extraction only');
    console.warn('Note: Image extraction requires pdfjs-dist. Text extraction will still work.');
  }
  
  for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
    let pageText = '';
    let images: ExtractedImage[] = [];
    
    if (pdfjsLib && pdfDocument) {
      try {
        const page = await pdfDocument.getPage(pageNum);
        const textContent = await page.getTextContent();
        
        pageText = textContent.items
          .map((item: any) => item.str)
          .join(' ')
          .trim();
        
        // Extract images from page
        images = await extractImagesFromPage(page, pageNum, pdfjsLib);
      } catch (error) {
        console.warn(`Warning: Could not extract from page ${pageNum} using pdfjs:`, error);
        // Fallback: use pdf-parse text (all pages combined, split roughly)
        const allText = pdfData.text;
        const textPerPage = Math.ceil(allText.length / totalPages);
        const startIdx = (pageNum - 1) * textPerPage;
        pageText = allText.substring(startIdx, startIdx + textPerPage).trim();
      }
    } else {
      // Fallback: split pdf-parse text across pages
      const allText = pdfData.text;
      const textPerPage = Math.ceil(allText.length / totalPages);
      const startIdx = (pageNum - 1) * textPerPage;
      pageText = allText.substring(startIdx, startIdx + textPerPage).trim();
    }
    
    pages.push({
      pageNumber: pageNum,
      text: pageText,
      images: images
    });
  }
  
  return pages;
}

/**
 * Extract images from a PDF page
 */
async function extractImagesFromPage(
  page: any,
  pageNumber: number,
  pdfjsLib: any
): Promise<ExtractedImage[]> {
  const images: ExtractedImage[] = [];
  
  try {
    const ops = await page.getOperatorList();
    const imagePromises: Promise<ExtractedImage | null>[] = [];
    
    for (let i = 0; i < ops.fnArray.length; i++) {
      const op = ops.fnArray[i];
      
      if (op === pdfjsLib.OPS.paintImageXObject) {
        const imageName = ops.argsArray[i][0];
        imagePromises.push(
          extractImageFromXObject(page, imageName, pageNumber)
        );
      }
    }
    
    const extractedImages = await Promise.all(imagePromises);
    return extractedImages.filter((img): img is ExtractedImage => img !== null);
  } catch (error) {
    console.warn(`Warning: Could not extract images from page ${pageNumber}:`, error);
    return [];
  }
}

/**
 * Extract a single image from an XObject
 */
async function extractImageFromXObject(
  page: any,
  imageName: string,
  pageNumber: number
): Promise<ExtractedImage | null> {
  try {
    const xobject = await page.objs.get(imageName);
    
    if (!xobject) {
      return null;
    }
    
    const imgData = xobject;
    const width = imgData.width || 0;
    const height = imgData.height || 0;
    
    if (width === 0 || height === 0) {
      return null;
    }
    
    // Convert image data to buffer
    let imageBuffer: Buffer;
    let format = 'png';
    
    // Handle different image data formats
    if (imgData.data) {
      // Direct buffer data
      imageBuffer = Buffer.from(imgData.data);
      format = imgData.data.length > 1000000 ? 'png' : 'jpeg'; // Heuristic
    } else if (imgData.image) {
      // Pixel array data - render to canvas
      try {
        const canvas = createCanvas(width, height);
        const ctx = canvas.getContext('2d');
        const imageData = ctx.createImageData(width, height);
        
        // Copy pixel data
        const data = imgData.image;
        const dataLength = Math.min(data.length, imageData.data.length);
        for (let i = 0; i < dataLength; i++) {
          imageData.data[i] = data[i];
        }
        
        ctx.putImageData(imageData, 0, 0);
        imageBuffer = canvas.toBuffer('image/png');
        format = 'png';
      } catch (canvasError) {
        console.warn(`Canvas rendering failed for image ${imageName}:`, canvasError);
        return null;
      }
    } else if (imgData.objId) {
      // Try to get raw image data
      const rawData = await page.objs.get(imgData.objId);
      if (rawData && rawData.data) {
        imageBuffer = Buffer.from(rawData.data);
        format = 'png';
      } else {
        return null;
      }
    } else {
      return null;
    }
    
    // Convert to base64 for AI vision models
    const base64 = imageBuffer.toString('base64');
    const mimeType = format === 'png' ? 'image/png' : 'image/jpeg';
    const base64WithPrefix = `data:${mimeType};base64,${base64}`;
    
    return {
      data: imageBuffer,
      format: format,
      width: width,
      height: height,
      base64: base64WithPrefix
    };
  } catch (error) {
    console.warn(`Warning: Could not extract image ${imageName} from page ${pageNumber}:`, error);
    return null;
  }
}

/**
 * Save extracted images to disk
 */
export function saveImages(
  images: ExtractedImage[],
  outputDir: string,
  prefix: string
): string[] {
  const savedPaths: string[] = [];
  
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  images.forEach((image, index) => {
    const filename = `${prefix}-image-${index + 1}.${image.format}`;
    const filepath = path.join(outputDir, filename);
    fs.writeFileSync(filepath, image.data);
    savedPaths.push(filepath);
  });
  
  return savedPaths;
}
