import { getOrCreateUserId } from '@/lib/auth/session';
import { withErrorHandling, jsonOk } from '@/lib/api/response';
import { createCollectionSchema } from '@/lib/validation/schemas';
import { listCollections, createCollection } from '@/server/services/collection.service';

export const GET = withErrorHandling(async () => {
  const userId = await getOrCreateUserId();
  const collections = await listCollections(userId);
  return jsonOk(collections);
});

export const POST = withErrorHandling(async (request) => {
  const userId = await getOrCreateUserId();
  const body = await request.json();
  const data = createCollectionSchema.parse(body);
  const collection = await createCollection(userId, data);
  return jsonOk(collection, 201);
});
