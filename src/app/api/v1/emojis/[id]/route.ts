import { getOrCreateUserId } from '@/lib/auth/session';
import { withErrorHandling, jsonOk } from '@/lib/api/response';
import { updateEmojiSchema } from '@/lib/validation/schemas';
import { getEmoji, updateEmoji, deleteEmoji } from '@/server/services/emoji.service';

interface Context {
  params: Promise<{ id: string }>;
}

export const GET = withErrorHandling(async (_request, context) => {
  const { id } = await (context as Context).params;
  const userId = await getOrCreateUserId();
  const emoji = await getEmoji(userId, id);
  return jsonOk(emoji);
});

export const PATCH = withErrorHandling(async (request, context) => {
  const { id } = await (context as Context).params;
  const userId = await getOrCreateUserId();
  const body = await request.json();
  const data = updateEmojiSchema.parse(body);
  const emoji = await updateEmoji(userId, id, data);
  return jsonOk(emoji);
});

export const DELETE = withErrorHandling(async (_request, context) => {
  const { id } = await (context as Context).params;
  const userId = await getOrCreateUserId();
  await deleteEmoji(userId, id);
  return jsonOk({ id });
});
