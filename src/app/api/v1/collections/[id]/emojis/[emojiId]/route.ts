import { getOrCreateUserId } from '@/lib/auth/session';
import { withErrorHandling, jsonOk } from '@/lib/api/response';
import { removeEmojiFromCollection } from '@/server/services/collection.service';

interface Context {
  params: Promise<{ id: string; emojiId: string }>;
}

export const DELETE = withErrorHandling(async (_request, context) => {
  const { id, emojiId } = await (context as Context).params;
  const userId = await getOrCreateUserId();
  await removeEmojiFromCollection(userId, id, emojiId);
  return jsonOk({ id, emojiId });
});
