import { getOrCreateUserId } from '@/lib/auth/session';
import { withErrorHandling, jsonOk } from '@/lib/api/response';
import { addEmojiToCollectionSchema } from '@/lib/validation/schemas';
import { addEmojiToCollection } from '@/server/services/collection.service';

interface Context {
  params: Promise<{ id: string }>;
}

export const POST = withErrorHandling(async (request, context) => {
  const { id } = await (context as Context).params;
  const userId = await getOrCreateUserId();
  const body = await request.json();
  const { emojiId } = addEmojiToCollectionSchema.parse(body);
  const entry = await addEmojiToCollection(userId, id, emojiId);
  return jsonOk(entry, 201);
});
