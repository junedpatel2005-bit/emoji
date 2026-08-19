import { getOrCreateUserId } from '@/lib/auth/session';
import { withErrorHandling, jsonOk } from '@/lib/api/response';

export const GET = withErrorHandling(async () => {
  const userId = await getOrCreateUserId();
  return jsonOk({ userId });
});
