'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const LINKS = [
  { href: '/', label: 'Home' },
  { href: '/create', label: 'Create' },
  { href: '/library', label: 'Library' },
  { href: '/collections', label: 'Collections' },
  { href: '/keyboard', label: 'Keyboard' },
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/settings', label: 'Settings' },
];

export function Nav() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-zinc-800 bg-zinc-950/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link href="/" className="flex items-center gap-2 text-lg font-semibold text-zinc-100">
          <span className="text-2xl">🫠</span>
          EmojAI
        </Link>
        <nav className="flex flex-wrap items-center gap-1 overflow-x-auto">
          {LINKS.map((link) => {
            const active = link.href === '/' ? pathname === '/' : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'rounded-full px-3 py-1.5 text-sm font-medium transition-colors',
                  active ? 'bg-amber-500 text-zinc-950' : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100'
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
