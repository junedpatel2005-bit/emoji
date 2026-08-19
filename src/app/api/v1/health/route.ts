import { checkAIHealth } from '@/lib/ai/provider';
import { withErrorHandling, jsonOk } from '@/lib/api/response';

export const GET = withErrorHandling(async () => {
  const health = await checkAIHealth();
  return jsonOk(health);
});
