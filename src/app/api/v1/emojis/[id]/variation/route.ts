import { getOrCreateUserId } from '@/lib/auth/session';
import { withErrorHandling, jsonOk, jsonError } from '@/lib/api/response';
import { checkRateLimit } from '@/lib/rate-limit';
import { generateEmojiSchema } from '@/lib/validation/schemas';
import { createVariation } from '@/server/services/emoji.service';

interface Context {
  params: Promise<{ id: string }>;
}

export const POST = withErrorHandling(async (request, context) => {
  const { id } = await (context as Context).params;
  const userId = await getOrCreateUserId();

  const limit = checkRateLimit(`generate:${userId}`);
  if (!limit.allowed) {
    return jsonError(429, 'RATE_LIMIT', 'Too many generation requests. Please slow down.');
  }

  const body = await request.json().catch(() => ({}));
  const overrides = generateEmojiSchema.partial().parse(body);
  const emoji = await createVariation(userId, id, overrides);
  return jsonOk(emoji, 201);
});
