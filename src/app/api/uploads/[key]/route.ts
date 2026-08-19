import { promises as fs } from 'fs';
import path from 'path';
import { withErrorHandling, jsonError } from '@/lib/api/response';

const BASE_PATH = path.resolve(process.env.LOCAL_STORAGE_PATH || './public/uploads');

const MIME_TYPES: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.gif': 'image/gif',
};

interface Context {
  params: Promise<{ key: string }>;
}

// Serves files written by the local storage provider at request time. Next.js's
// production server only serves `public/` files that existed at build time, so
// runtime-generated uploads (emoji images) 404 if served from `/uploads/...` directly.
export const GET = withErrorHandling(async (_request, context) => {
  const { key } = await (context as Context).params;

  if (key.includes('..') || key.includes('/') || key.includes('\\')) {
    return jsonError(400, 'INVALID_KEY', 'Invalid file key');
  }

  const filePath = path.join(BASE_PATH, key);
  let file: Buffer;
  try {
    file = await fs.readFile(filePath);
  } catch {
    return jsonError(404, 'NOT_FOUND', 'File not found');
  }

  const ext = path.extname(key).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  return new Response(new Uint8Array(file), {
    headers: {
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
});
