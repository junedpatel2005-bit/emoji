import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { isAIProviderError } from '@/lib/ai/types';

export function jsonOk<T>(data: T, init?: number | ResponseInit) {
  return NextResponse.json({ data }, typeof init === 'number' ? { status: init } : init);
}

export function jsonError(status: number, code: string, message: string) {
  return NextResponse.json({ error: { code, message } }, { status });
}

/**
 * Centralizes error -> HTTP response mapping so route handlers stay thin and
 * never leak stack traces or internal error messages to clients.
 */
export function withErrorHandling(
  handler: (request: Request, context: unknown) => Promise<NextResponse>
) {
  return async (request: Request, context: unknown) => {
    try {
      return await handler(request, context);
    } catch (error) {
      if (error instanceof ZodError) {
        return jsonError(400, 'VALIDATION_ERROR', error.issues[0]?.message ?? 'Invalid request');
      }
      if (isAIProviderError(error)) {
        const status =
          error.code === 'RATE_LIMIT' ? 429 : error.code === 'AUTHENTICATION_ERROR' ? 502 : 400;
        return jsonError(status, error.code, error.message);
      }
      if (error instanceof NotFoundError) {
        return jsonError(404, 'NOT_FOUND', error.message);
      }
      if (error instanceof ForbiddenError) {
        return jsonError(403, 'FORBIDDEN', error.message);
      }
      console.error('[API]', error);
      return jsonError(500, 'INTERNAL_ERROR', 'Something went wrong. Please try again.');
    }
  };
}

export class NotFoundError extends Error {}
export class ForbiddenError extends Error {}
