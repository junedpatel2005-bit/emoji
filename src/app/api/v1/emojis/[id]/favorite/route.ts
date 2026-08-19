import { getOrCreateUserId } from '@/lib/auth/session';
import { withErrorHandling, jsonOk } from '@/lib/api/response';
import { toggleFavorite } from '@/server/services/emoji.service';

interface Context {
  params: Promise<{ id: string }>;
}

export const POST = withErrorHandling(async (_request, context) => {
  const { id } = await (context as Context).params;
  const userId = await getOrCreateUserId();
  const emoji = await toggleFavorite(userId, id);
  return jsonOk(emoji);
});
