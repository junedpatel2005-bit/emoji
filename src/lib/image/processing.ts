import sharp from 'sharp';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface ImageProcessingOptions {
  width?: number;
  height?: number;
  format?: 'png' | 'webp' | 'jpeg' | 'avif';
  quality?: number;
  fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
  background?: { r: number; g: number; b: number; alpha?: number };
  withoutEnlargement?: boolean;
}

export interface ThumbnailOptions {
  sizes: number[];
  format?: 'png' | 'webp';
  quality?: number;
  prefix?: string;
}

export interface ProcessedImage {
  buffer: Buffer;
  width: number;
  height: number;
  format: string;
  size: number;
}

export interface ThumbnailResult {
  size: number;
  buffer: Buffer;
  width: number;
  height: number;
  url: string;
}

export async function processImage(
  input: Buffer | string,
  options: ImageProcessingOptions = {}
): Promise<ProcessedImage> {
  const {
    width,
    height,
    format = 'png',
    quality = 90,
    fit = 'inside',
    background = { r: 0, g: 0, b: 0, alpha: 0 },
    withoutEnlargement = true,
  } = options;

  let pipeline = sharp(input);

  const metadata = await pipeline.metadata();
  
  if (width || height) {
    pipeline = pipeline.resize(width, height, {
      fit,
      background,
      withoutEnlargement,
    });
  }

  switch (format) {
    case 'png':
      pipeline = pipeline.png({ quality, compressionLevel: 9 });
      break;
    case 'webp':
      pipeline = pipeline.webp({ quality, lossless: quality === 100 });
      break;
    case 'jpeg':
      pipeline = pipeline.jpeg({ quality, mozjpeg: true });
      break;
    case 'avif':
      pipeline = pipeline.avif({ quality, lossless: quality === 100 });
      break;
  }

  const buffer = await pipeline.toBuffer();
  const outputMetadata = await sharp(buffer).metadata();

  return {
    buffer,
    width: outputMetadata.width || 0,
    height: outputMetadata.height || 0,
    format,
    size: buffer.length,
  };
}

export async function generateThumbnails(
  input: Buffer | string,
  options: ThumbnailOptions
): Promise<ThumbnailResult[]> {
  const { sizes, format = 'png', quality = 85, prefix = 'thumb' } = options;
  const results: ThumbnailResult[] = [];

  for (const size of sizes) {
    const processed = await processImage(input, {
      width: size,
      height: size,
      format,
      quality,
      fit: 'inside',
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    });

    results.push({
      size,
      buffer: processed.buffer,
      width: processed.width,
      height: processed.height,
      url: '', // Will be set after upload
    });
  }

  return results;
}

export async function optimizeImage(
  input: Buffer,
  options: {
    maxWidth?: number;
    maxHeight?: number;
    maxSizeKB?: number;
    format?: 'png' | 'webp';
    quality?: number;
  } = {}
): Promise<ProcessedImage> {
  const { maxWidth = 1024, maxHeight = 1024, maxSizeKB = 500, format = 'webp', quality = 85 } = options;

  let currentQuality = quality;
  let processed = await processImage(input, {
    width: maxWidth,
    height: maxHeight,
    format,
    quality: currentQuality,
    fit: 'inside',
    background: { r: 0, g: 0, b: 0, alpha: 0 },
  });

  // Reduce quality if file is too large
  while (processed.size > maxSizeKB * 1024 && currentQuality > 10) {
    currentQuality -= 10;
    processed = await processImage(input, {
      width: maxWidth,
      height: maxHeight,
      format,
      quality: currentQuality,
      fit: 'inside',
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    });
  }

  return processed;
}

export async function extractMetadata(input: Buffer | string) {
  const metadata = await sharp(input).metadata();
  return {
    width: metadata.width,
    height: metadata.height,
    format: metadata.format,
    size: metadata.size,
    density: metadata.density,
    hasAlpha: metadata.hasAlpha,
    space: metadata.space,
    channels: metadata.channels,
  };
}

export function validateImageFile(buffer: Buffer, allowedMimeTypes: string[] = ['image/png', 'image/jpeg', 'image/webp', 'image/gif']): { valid: boolean; mimeType?: string; error?: string } {
  // Check file signature (magic bytes)
  const signatures: Record<string, number[][]> = {
    'image/png': [[0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]],
    'image/jpeg': [[0xFF, 0xD8, 0xFF]],
    'image/webp': [[0x52, 0x49, 0x46, 0x46], [0x57, 0x45, 0x42, 0x50]], // RIFF....WEBP
    'image/gif': [[0x47, 0x49, 0x46, 0x38, 0x37, 0x61], [0x47, 0x49, 0x46, 0x38, 0x39, 0x61]], // GIF87a, GIF89a
  };

  for (const [mimeType, sigs] of Object.entries(signatures)) {
    for (const sig of sigs) {
      if (sig.every((byte, i) => buffer[i] === byte)) {
        if (allowedMimeTypes.includes(mimeType)) {
          return { valid: true, mimeType };
        }
        return { valid: false, mimeType, error: `File type ${mimeType} is not allowed` };
      }
    }
  }

  return { valid: false, error: 'Invalid or unsupported image format' };
}

export async function convertToPNG(input: Buffer): Promise<Buffer> {
  return sharp(input).png({ compressionLevel: 9 }).toBuffer();
}

export async function convertToWebP(input: Buffer, quality = 85): Promise<Buffer> {
  return sharp(input).webp({ quality, lossless: quality === 100 }).toBuffer();
}

export async function removeBackground(input: Buffer): Promise<Buffer> {
  // Placeholder for background removal
  // In production, integrate with a background removal service like remove.bg
  // or use a local model like RMBG
  console.warn('[Image] Background removal not implemented, returning original');
  return input;
}

export function getMimeTypeFromExtension(filename: string): string {
  const ext = path.extname(filename).toLowerCase();
  const mimeTypes: Record<string, string> = {
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.webp': 'image/webp',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.avif': 'image/avif',
  };
  return mimeTypes[ext] || 'application/octet-stream';
}

export function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/_{2,}/g, '_')
    .substring(0, 255);
}

export async function saveImage(buffer: Buffer, outputPath: string): Promise<void> {
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, buffer);
}