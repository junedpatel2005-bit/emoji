'use client';

import { use } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ArrowLeft, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { apiFetch } from '@/lib/api/client';
import type { Collection, CollectionEmoji, Emoji } from '@/generated/prisma/browser';

type CollectionDetail = Collection & { emojis: (CollectionEmoji & { emoji: Emoji })[] };

export default function CollectionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: collection, isLoading } = useQuery({
    queryKey: ['collection', id],
    queryFn: () => apiFetch<CollectionDetail>(`/api/v1/collections/${id}`),
  });

  const removeMutation = useMutation({
    mutationFn: (emojiId: string) =>
      apiFetch(`/api/v1/collections/${id}/emojis/${emojiId}`, { method: 'DELETE' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['collection', id] }),
  });

  const deleteMutation = useMutation({
    mutationFn: () => apiFetch(`/api/v1/collections/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      toast.success('Collection deleted');
      queryClient.invalidateQueries({ queryKey: ['collections'] });
      router.push('/collections');
    },
    onError: (error: Error) => toast.error(error.message),
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-24">
        <Spinner className="h-6 w-6" />
      </div>
    );
  }

  if (!collection) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-24 text-center text-zinc-400">
        Collection not found. <Link href="/collections" className="text-amber-400 hover:underline">Back to collections</Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <Link href="/collections" className="mb-6 inline-flex items-center gap-1 text-sm text-zinc-400 hover:text-zinc-200">
        <ArrowLeft className="h-4 w-4" /> Back to collections
      </Link>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-50">{collection.name}</h1>
          {collection.description && <p className="mt-1 text-sm text-zinc-400">{collection.description}</p>}
        </div>
        <Button
          size="sm"
          variant="destructive"
          onClick={() => {
            if (confirm('Delete this collection? Emojis inside it will not be deleted.')) deleteMutation.mutate();
          }}
        >
          <Trash2 className="h-4 w-4" /> Delete collection
        </Button>
      </div>

      {collection.emojis.length === 0 && (
        <Card className="mt-8 text-center text-zinc-400">
          No emojis in this collection yet. Add some from your{' '}
          <Link href="/library" className="text-amber-400 hover:underline">
            library
          </Link>
          .
        </Card>
      )}

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {collection.emojis.map(({ emoji }) => (
          <Card key={emoji.id} className="group relative flex flex-col items-center gap-2 p-3">
            <Link href={`/emoji/${emoji.id}`} className="relative aspect-square w-full overflow-hidden rounded-lg bg-zinc-800">
              <Image src={emoji.imageUrl} alt={emoji.name} fill className="object-contain p-2" unoptimized />
            </Link>
            <p className="w-full truncate text-center text-xs text-zinc-400">{emoji.name}</p>
            <button
              onClick={() => removeMutation.mutate(emoji.id)}
              className="absolute right-2 top-2 rounded-full bg-zinc-900/80 p-1 text-zinc-400 opacity-0 hover:text-red-400 group-hover:opacity-100"
              aria-label="Remove from collection"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </Card>
        ))}
      </div>
    </div>
  );
}
