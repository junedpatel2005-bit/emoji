import { getOrCreateUserId } from '@/lib/auth/session';
import { withErrorHandling, jsonOk } from '@/lib/api/response';
import { emojiQuerySchema } from '@/lib/validation/schemas';
import { listEmojis } from '@/server/services/emoji.service';

export const GET = withErrorHandling(async (request) => {
  const userId = await getOrCreateUserId();
  const url = new URL(request.url);
  const query = emojiQuerySchema.parse(Object.fromEntries(url.searchParams));
  const result = await listEmojis(userId, query);
  return jsonOk(result);
});
