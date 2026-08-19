import { getOrCreateUserId } from '@/lib/auth/session';
import { withErrorHandling, jsonOk, jsonError } from '@/lib/api/response';
import { checkRateLimit } from '@/lib/rate-limit';
import { generateEmojiSchema } from '@/lib/validation/schemas';
import { generateAndSaveEmoji } from '@/server/services/emoji.service';

export const POST = withErrorHandling(async (request) => {
  const userId = await getOrCreateUserId();

  const limit = checkRateLimit(`generate:${userId}`);
  if (!limit.allowed) {
    return jsonError(429, 'RATE_LIMIT', 'Too many generation requests. Please slow down.');
  }

  const body = await request.json();
  const input = generateEmojiSchema.parse(body);
  const emoji = await generateAndSaveEmoji(userId, input);

  return jsonOk(emoji, 201);
});
