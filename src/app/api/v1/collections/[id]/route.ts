import { getOrCreateUserId } from '@/lib/auth/session';
import { withErrorHandling, jsonOk } from '@/lib/api/response';
import { updateCollectionSchema } from '@/lib/validation/schemas';
import { getCollection, updateCollection, deleteCollection } from '@/server/services/collection.service';

interface Context {
  params: Promise<{ id: string }>;
}

export const GET = withErrorHandling(async (_request, context) => {
  const { id } = await (context as Context).params;
  const userId = await getOrCreateUserId();
  const collection = await getCollection(userId, id);
  return jsonOk(collection);
});

export const PATCH = withErrorHandling(async (request, context) => {
  const { id } = await (context as Context).params;
  const userId = await getOrCreateUserId();
  const body = await request.json();
  const data = updateCollectionSchema.parse(body);
  const collection = await updateCollection(userId, id, data);
  return jsonOk(collection);
});

export const DELETE = withErrorHandling(async (_request, context) => {
  const { id } = await (context as Context).params;
  const userId = await getOrCreateUserId();
  await deleteCollection(userId, id);
  return jsonOk({ id });
});
