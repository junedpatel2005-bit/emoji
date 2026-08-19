'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Heart, Search, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { apiFetch } from '@/lib/api/client';
import { cn } from '@/lib/utils';
import type { Emoji } from '@/generated/prisma/browser';

interface EmojiListResult {
  items: Emoji[];
  total: number;
  page: number;
  totalPages: number;
}

export default function LibraryPage() {
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('newest');
  const [favoriteOnly, setFavoriteOnly] = useState(false);
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();

  const params = new URLSearchParams({ page: String(page), limit: '24', sort });
  if (search) params.set('search', search);
  if (favoriteOnly) params.set('favorite', 'true');

  const { data, isLoading } = useQuery({
    queryKey: ['emojis', params.toString()],
    queryFn: () => apiFetch<EmojiListResult>(`/api/v1/emojis?${params.toString()}`),
  });

  const favoriteMutation = useMutation({
    mutationFn: (id: string) => apiFetch<Emoji>(`/api/v1/emojis/${id}/favorite`, { method: 'POST' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['emojis'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiFetch<{ id: string }>(`/api/v1/emojis/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      toast.success('Emoji deleted');
      queryClient.invalidateQueries({ queryKey: ['emojis'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold text-zinc-50">Your Library</h1>
        <Link href="/create">
          <Button size="sm">New emoji</Button>
        </Link>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <div className="relative w-full max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <Input
            placeholder="Search emojis…"
            className="pl-9"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <Select className="w-auto" value={sort} onChange={(e) => setSort(e.target.value)}>
          <option value="newest">Newest</option>
          <option value="oldest">Oldest</option>
          <option value="mostUsed">Most used</option>
          <option value="name">Name</option>
        </Select>
        <button
          onClick={() => {
            setFavoriteOnly((v) => !v);
            setPage(1);
          }}
          className={cn(
            'flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors',
            favoriteOnly ? 'bg-amber-500 text-zinc-950' : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
          )}
        >
          <Heart className={cn('h-3.5 w-3.5', favoriteOnly && 'fill-current')} />
          Favorites
        </button>
      </div>

      {isLoading && (
        <div className="flex justify-center py-24">
          <Spinner className="h-6 w-6" />
        </div>
      )}

      {!isLoading && data?.items.length === 0 && (
        <Card className="mt-8 text-center text-zinc-400">
          No emojis yet.{' '}
          <Link href="/create" className="text-amber-400 hover:underline">
            Create your first one
          </Link>
          .
        </Card>
      )}

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {data?.items.map((emoji) => (
          <Card key={emoji.id} className="group relative flex flex-col items-center gap-2 p-3">
            <Link href={`/emoji/${emoji.id}`} className="relative aspect-square w-full overflow-hidden rounded-lg bg-zinc-800">
              <Image src={emoji.imageUrl} alt={emoji.name} fill className="object-contain p-2" unoptimized />
            </Link>
            <p className="w-full truncate text-center text-xs text-zinc-400">{emoji.name}</p>
            <div className="flex w-full items-center justify-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
              <button
                onClick={() => favoriteMutation.mutate(emoji.id)}
                className={cn('rounded-full p-1.5 hover:bg-zinc-800', emoji.favorite ? 'text-amber-400' : 'text-zinc-500')}
                aria-label="Toggle favorite"
              >
                <Heart className={cn('h-3.5 w-3.5', emoji.favorite && 'fill-current')} />
              </button>
              <button
                onClick={() => {
                  if (confirm(`Delete "${emoji.name}"?`)) deleteMutation.mutate(emoji.id);
                }}
                className="rounded-full p-1.5 text-zinc-500 hover:bg-zinc-800 hover:text-red-400"
                aria-label="Delete"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </Card>
        ))}
      </div>

      {data && data.totalPages > 1 && (
        <div className="mt-8 flex justify-center gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            Previous
          </Button>
          <span className="flex items-center px-2 text-sm text-zinc-400">
            Page {data.page} of {data.totalPages}
          </span>
          <Button variant="outline" size="sm" disabled={page >= data.totalPages} onClick={() => setPage((p) => p + 1)}>
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
