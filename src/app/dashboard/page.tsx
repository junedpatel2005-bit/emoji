'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Sparkles, Heart, Layers, Activity } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { Badge } from '@/components/ui/badge';
import { apiFetch } from '@/lib/api/client';
import type { Emoji } from '@/generated/prisma/browser';

interface DashboardStats {
  totalEmojis: number;
  favoriteCount: number;
  collectionCount: number;
  recent: Emoji[];
}

interface HealthResult {
  healthy: boolean;
  provider: string;
}

export default function DashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => apiFetch<DashboardStats>('/api/v1/dashboard'),
  });

  const { data: health } = useQuery({
    queryKey: ['health'],
    queryFn: () => apiFetch<HealthResult>('/api/v1/health'),
    staleTime: 30_000,
  });

  if (isLoading || !data) {
    return (
      <div className="flex justify-center py-24">
        <Spinner className="h-6 w-6" />
      </div>
    );
  }

  const stats = [
    { label: 'Emojis generated', value: data.totalEmojis, icon: Sparkles },
    { label: 'Favorites', value: data.favoriteCount, icon: Heart },
    { label: 'Collections', value: data.collectionCount, icon: Layers },
  ];

  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold text-zinc-50">Dashboard</h1>
        {health && (
          <Badge className="gap-1.5">
            <Activity className={health.healthy ? 'h-3 w-3 text-green-400' : 'h-3 w-3 text-red-400'} />
            {health.provider} provider · {health.healthy ? 'healthy' : 'using mock fallback'}
          </Badge>
        )}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {stats.map(({ label, value, icon: Icon }) => (
          <Card key={label} className="flex items-center gap-4">
            <div className="rounded-xl bg-amber-500/10 p-2.5 text-amber-400">
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-zinc-50">{value}</p>
              <p className="text-sm text-zinc-500">{label}</p>
            </div>
          </Card>
        ))}
      </div>

      <h2 className="mt-10 text-lg font-semibold text-zinc-100">Recent generations</h2>
      {data.recent.length === 0 ? (
        <Card className="mt-4 text-center text-zinc-400">
          Nothing yet.{' '}
          <Link href="/create" className="text-amber-400 hover:underline">
            Generate your first emoji
          </Link>
          .
        </Card>
      ) : (
        <div className="mt-4 grid grid-cols-3 gap-4 sm:grid-cols-4 md:grid-cols-8">
          {data.recent.map((emoji) => (
            <Link key={emoji.id} href={`/emoji/${emoji.id}`}>
              <Card className="relative aspect-square p-2">
                <Image src={emoji.imageUrl} alt={emoji.name} fill className="object-contain p-2" unoptimized />
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
