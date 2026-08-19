import { getOrCreateUserId } from '@/lib/auth/session';
import { withErrorHandling, jsonOk } from '@/lib/api/response';
import { getDashboardStats } from '@/server/services/emoji.service';

export const GET = withErrorHandling(async () => {
  const userId = await getOrCreateUserId();
  const stats = await getDashboardStats(userId);
  return jsonOk(stats);
});
