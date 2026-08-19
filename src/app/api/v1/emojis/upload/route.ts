import { getOrCreateUserId } from '@/lib/auth/session';
import { withErrorHandling, jsonOk, jsonError } from '@/lib/api/response';
import { checkRateLimit } from '@/lib/rate-limit';
import { uploadImageSchema, transformEmojiSchema } from '@/lib/validation/schemas';
import { transformAndSaveEmoji } from '@/server/services/emoji.service';

const ACCEPTED_MIME_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp', 'image/gif']);
const MAX_UPLOAD_BYTES = (Number(process.env.MAX_UPLOAD_SIZE_MB) || 10) * 1024 * 1024;

export const POST = withErrorHandling(async (request) => {
  const userId = await getOrCreateUserId();

  const limit = checkRateLimit(`upload:${userId}`);
  if (!limit.allowed) {
    return jsonError(429, 'RATE_LIMIT', 'Too many upload requests. Please slow down.');
  }

  const formData = await request.formData();
  const file = formData.get('file');
  const prompt = String(formData.get('prompt') ?? '');
  const style = formData.get('style');
  const expression = formData.get('expression');
  const background = formData.get('background');

  if (!(file instanceof File)) {
    return jsonError(400, 'VALIDATION_ERROR', 'A file upload is required');
  }
  if (!ACCEPTED_MIME_TYPES.has(file.type)) {
    return jsonError(400, 'VALIDATION_ERROR', 'Unsupported image type');
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return jsonError(400, 'VALIDATION_ERROR', 'File exceeds the maximum upload size');
  }

  uploadImageSchema.parse({ filename: file.name, mimeType: file.type, size: file.size });
  const { style: parsedStyle, expression: parsedExpression, background: parsedBackground } =
    transformEmojiSchema
      .pick({ style: true, expression: true, background: true })
      .parse({ style: style || undefined, expression: expression || undefined, background: background || undefined });

  const arrayBuffer = await file.arrayBuffer();
  const safeFilename = file.name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(-100);

  const emoji = await transformAndSaveEmoji(
    userId,
    { buffer: Buffer.from(arrayBuffer), filename: safeFilename, mimeType: file.type },
    { prompt: prompt || 'Transform this image into an emoji', style: parsedStyle, expression: parsedExpression, background: parsedBackground }
  );

  return jsonOk(emoji, 201);
});
