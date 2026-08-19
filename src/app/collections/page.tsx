'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { FolderPlus, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Dialog, DialogTrigger, DialogContent } from '@/components/ui/dialog';
import { Spinner } from '@/components/ui/spinner';
import { apiFetch } from '@/lib/api/client';
import type { Collection } from '@/generated/prisma/browser';

type CollectionWithCount = Collection & { _count: { emojis: number } };

export default function CollectionsPage() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['collections'],
    queryFn: () => apiFetch<CollectionWithCount[]>('/api/v1/collections'),
  });

  const createMutation = useMutation({
    mutationFn: () => apiFetch<Collection>('/api/v1/collections', { method: 'POST', body: JSON.stringify({ name }) }),
    onSuccess: () => {
      toast.success('Collection created');
      setName('');
      setOpen(false);
      queryClient.invalidateQueries({ queryKey: ['collections'] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-zinc-50">Collections</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <FolderPlus className="h-4 w-4" /> New collection
            </Button>
          </DialogTrigger>
          <DialogContent title="New collection">
            <div className="space-y-4">
              <Input placeholder="Collection name" value={name} onChange={(e) => setName(e.target.value)} maxLength={100} />
              <Button
                className="w-full"
                disabled={!name.trim() || createMutation.isPending}
                onClick={() => createMutation.mutate()}
              >
                {createMutation.isPending ? <Spinner /> : 'Create'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading && (
        <div className="flex justify-center py-24">
          <Spinner className="h-6 w-6" />
        </div>
      )}

      {!isLoading && data?.length === 0 && (
        <Card className="mt-8 text-center text-zinc-400">No collections yet. Create one to start organizing your emojis.</Card>
      )}

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
        {data?.map((collection) => (
          <Link key={collection.id} href={`/collections/${collection.id}`}>
            <Card className="flex items-center gap-3 transition-colors hover:border-amber-400/50">
              <div className="rounded-xl bg-amber-500/10 p-2.5 text-amber-400">
                <Layers className="h-5 w-5" />
              </div>
              <div>
                <p className="font-medium text-zinc-100">{collection.name}</p>
                <p className="text-sm text-zinc-500">{collection._count.emojis} emojis</p>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
