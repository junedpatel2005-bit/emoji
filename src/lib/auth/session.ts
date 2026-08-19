import { cookies } from 'next/headers';
import { prisma } from '@/lib/db/prisma';

const COOKIE_NAME = 'emojai_uid';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

/**
 * Anonymous session model: no login flow exists yet (see README roadmap),
 * so each visitor gets a cookie-bound User row created on first API call.
 * Must be called from a Route Handler or Server Action — Server Components
 * can read cookies but cannot set them.
 */
export async function getOrCreateUserId(): Promise<string> {
  const store = await cookies();
  const existing = store.get(COOKIE_NAME)?.value;

  if (existing) {
    const user = await prisma.user.findUnique({ where: { id: existing } });
    if (user) return user.id;
  }

  const user = await prisma.user.create({
    data: { email: `guest-${crypto.randomUUID()}@emojai.local` },
  });

  store.set(COOKIE_NAME, user.id, {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: COOKIE_MAX_AGE,
    path: '/',
  });

  return user.id;
}
