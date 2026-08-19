'use client';

import { use, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Heart, Download, Copy, Sparkles, Trash2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select } from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { apiFetch } from '@/lib/api/client';
import { getStyleDisplayName, getExpressionDisplayName } from '@/lib/ai/prompts';
import type { Emoji, Collection } from '@/generated/prisma/browser';
import type { EmojiStyle, EmojiExpression } from '@/lib/ai/types';

export default function EmojiDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const queryClient = useQueryClient();
  const router = useRouter();

  const { data: emoji, isLoading } = useQuery({
    queryKey: ['emoji', id],
    queryFn: () => apiFetch<Emoji>(`/api/v1/emojis/${id}`),
  });

  const [variationBusy, setVariationBusy] = useState(false);

  const favoriteMutation = useMutation({
    mutationFn: () => apiFetch<Emoji>(`/api/v1/emojis/${id}/favorite`, { method: 'POST' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['emoji', id] }),
  });

  const usageMutation = useMutation({
    mutationFn: (action: string) =>
      apiFetch(`/api/v1/emojis/${id}/usage`, { method: 'POST', body: JSON.stringify({ action }) }),
  });

  const variationMutation = useMutation({
    mutationFn: () => apiFetch<Emoji>(`/api/v1/emojis/${id}/variation`, { method: 'POST', body: JSON.stringify({}) }),
    onSuccess: (variation) => {
      toast.success('Variation created!');
      queryClient.invalidateQueries({ queryKey: ['emojis'] });
      router.push(`/emoji/${variation.id}`);
    },
    onError: (error: Error) => toast.error(error.message),
    onSettled: () => setVariationBusy(false),
  });

  const deleteMutation = useMutation({
    mutationFn: () => apiFetch(`/api/v1/emojis/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      toast.success('Emoji deleted');
      queryClient.invalidateQueries({ queryKey: ['emojis'] });
      router.push('/library');
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const { data: collections } = useQuery({
    queryKey: ['collections'],
    queryFn: () => apiFetch<Collection[]>('/api/v1/collections'),
  });

  const [selectedCollection, setSelectedCollection] = useState('');
  const addToCollectionMutation = useMutation({
    mutationFn: (collectionId: string) =>
      apiFetch(`/api/v1/collections/${collectionId}/emojis`, {
        method: 'POST',
        body: JSON.stringify({ emojiId: id }),
      }),
    onSuccess: () => toast.success('Added to collection'),
    onError: (error: Error) => toast.error(error.message),
  });

  async function handleCopy() {
    if (!emoji) return;
    try {
      const res = await fetch(emoji.imageUrl);
      const blob = await res.blob();
      await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })]);
      toast.success('Copied to clipboard');
      usageMutation.mutate('copy');
    } catch {
      toast.error('Copy not supported in this browser');
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-24">
        <Spinner className="h-6 w-6" />
      </div>
    );
  }

  if (!emoji) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-24 text-center text-zinc-400">
        Emoji not found. <Link href="/library" className="text-amber-400 hover:underline">Back to library</Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <Link href="/library" className="mb-6 inline-flex items-center gap-1 text-sm text-zinc-400 hover:text-zinc-200">
        <ArrowLeft className="h-4 w-4" /> Back to library
      </Link>

      <Card className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
        <div className="relative h-40 w-40 shrink-0 overflow-hidden rounded-2xl bg-zinc-800">
          <Image src={emoji.imageUrl} alt={emoji.name} fill className="object-contain p-4" unoptimized />
        </div>
        <div className="flex-1">
          <h1 className="text-xl font-semibold text-zinc-50">{emoji.name}</h1>
          {emoji.prompt && <p className="mt-1 text-sm text-zinc-400">&ldquo;{emoji.prompt}&rdquo;</p>}
          <div className="mt-3 flex flex-wrap gap-2">
            {emoji.style && <Badge>{getStyleDisplayName(emoji.style as EmojiStyle)}</Badge>}
            {emoji.expression && <Badge>{getExpressionDisplayName(emoji.expression as EmojiExpression)}</Badge>}
            <Badge>{emoji.sourceType}</Badge>
            <Badge>{emoji.usageCount} uses</Badge>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <Button size="sm" variant={emoji.favorite ? 'primary' : 'secondary'} onClick={() => favoriteMutation.mutate()}>
              <Heart className={emoji.favorite ? 'h-4 w-4 fill-current' : 'h-4 w-4'} />
              {emoji.favorite ? 'Favorited' : 'Favorite'}
            </Button>
            <a href={emoji.imageUrl} download={`${emoji.slug}.${(emoji.mimeType.split('/')[1] ?? 'png').split('+')[0]}`}>
              <Button size="sm" variant="secondary" onClick={() => usageMutation.mutate('download')}>
                <Download className="h-4 w-4" /> Download
              </Button>
            </a>
            <Button size="sm" variant="secondary" onClick={handleCopy}>
              <Copy className="h-4 w-4" /> Copy
            </Button>
            <Button
              size="sm"
              variant="secondary"
              disabled={variationBusy || variationMutation.isPending}
              onClick={() => {
                setVariationBusy(true);
                variationMutation.mutate();
              }}
            >
              {variationMutation.isPending ? <Spinner /> : <Sparkles className="h-4 w-4" />} Variation
            </Button>
            <Button
              size="sm"
              variant="destructive"
              disabled={deleteMutation.isPending}
              onClick={() => {
                if (confirm('Delete this emoji? This cannot be undone.')) deleteMutation.mutate();
              }}
            >
              <Trash2 className="h-4 w-4" /> Delete
            </Button>
          </div>

          {collections && collections.length > 0 && (
            <div className="mt-5 flex items-center gap-2">
              <Select
                className="w-auto"
                value={selectedCollection}
                onChange={(e) => setSelectedCollection(e.target.value)}
              >
                <option value="">Add to collection…</option>
                {collections.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
              <Button
                size="sm"
                variant="outline"
                disabled={!selectedCollection || addToCollectionMutation.isPending}
                onClick={() => addToCollectionMutation.mutate(selectedCollection)}
              >
                Add
              </Button>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}

