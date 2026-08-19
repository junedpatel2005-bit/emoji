import { getOrCreateUserId } from '@/lib/auth/session';
import { withErrorHandling, jsonOk } from '@/lib/api/response';
import { usageEventSchema } from '@/lib/validation/schemas';
import { recordUsage } from '@/server/services/emoji.service';

interface Context {
  params: Promise<{ id: string }>;
}

export const POST = withErrorHandling(async (request, context) => {
  const { id } = await (context as Context).params;
  const userId = await getOrCreateUserId();
  const body = await request.json();
  const input = usageEventSchema.parse({ ...body, emojiId: id });
  await recordUsage(userId, input);
  return jsonOk({ ok: true });
});
