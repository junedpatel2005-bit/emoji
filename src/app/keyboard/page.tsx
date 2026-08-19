'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useQuery, useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { apiFetch } from '@/lib/api/client';
import type { Emoji } from '@/generated/prisma/browser';

interface EmojiListResult {
  items: Emoji[];
}

export default function KeyboardPage() {
  const [search, setSearch] = useState('');

  const params = new URLSearchParams({ limit: '60', sort: 'newest' });
  if (search) params.set('search', search);

  const { data, isLoading } = useQuery({
    queryKey: ['emojis', 'keyboard', params.toString()],
    queryFn: () => apiFetch<EmojiListResult>(`/api/v1/emojis?${params.toString()}`),
  });

  const usageMutation = useMutation({
    mutationFn: (emojiId: string) =>
      apiFetch(`/api/v1/emojis/${emojiId}/usage`, { method: 'POST', body: JSON.stringify({ action: 'copy' }) }),
  });

  async function handlePick(emoji: Emoji) {
    try {
      const res = await fetch(emoji.imageUrl);
      const blob = await res.blob();
      await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })]);
      toast.success(`"${emoji.name}" copied — paste it anywhere`);
      usageMutation.mutate(emoji.id);
    } catch {
      toast.error('Copy not supported in this browser');
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="text-2xl font-semibold text-zinc-50">Keyboard Preview</h1>
      <p className="mt-1 text-sm text-zinc-400">
        A browser-based prototype of how EmojAI could work as a mobile keyboard. Tap an emoji to copy it.
      </p>

      <div className="relative mt-6 max-w-xs">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
        <Input placeholder="Search your emojis…" className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <Card className="mt-6 rounded-3xl bg-zinc-900 p-4">
        {isLoading && (
          <div className="flex justify-center py-16">
            <Spinner className="h-6 w-6" />
          </div>
        )}
        {!isLoading && data?.items.length === 0 && (
          <p className="py-16 text-center text-sm text-zinc-500">No emojis to show yet — generate some first.</p>
        )}
        <div className="grid grid-cols-6 gap-2 sm:grid-cols-8">
          {data?.items.map((emoji) => (
            <button
              key={emoji.id}
              onClick={() => handlePick(emoji)}
              title={emoji.name}
              className="relative aspect-square overflow-hidden rounded-xl bg-zinc-800 transition-transform hover:scale-105 active:scale-95"
            >
              <Image src={emoji.imageUrl} alt={emoji.name} fill className="object-contain p-1.5" unoptimized />
            </button>
          ))}
        </div>
      </Card>
    </div>
  );
}
