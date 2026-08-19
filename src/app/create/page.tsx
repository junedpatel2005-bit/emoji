'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Sparkles, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { apiFetch } from '@/lib/api/client';
import {
  STYLE_PROMPTS,
  EXPRESSION_PROMPTS,
  BACKGROUND_PROMPTS,
  getStyleDisplayName,
  getExpressionDisplayName,
  getBackgroundDisplayName,
} from '@/lib/ai/prompts';
import type { EmojiStyle, EmojiExpression, EmojiBackground } from '@/lib/ai/types';
import type { Emoji } from '@/generated/prisma/browser';
import { cn } from '@/lib/utils';

const STYLE_OPTIONS = Object.keys(STYLE_PROMPTS) as EmojiStyle[];
const EXPRESSION_OPTIONS = Object.keys(EXPRESSION_PROMPTS) as EmojiExpression[];
const BACKGROUND_OPTIONS = Object.keys(BACKGROUND_PROMPTS) as EmojiBackground[];

export default function CreatePage() {
  const [mode, setMode] = useState<'text' | 'image'>('text');

  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <h1 className="text-2xl font-semibold text-zinc-50">Emoji Studio</h1>
      <p className="mt-1 text-sm text-zinc-400">Generate a custom emoji from a text prompt, or transform an image.</p>

      <div className="mt-6 flex gap-2">
        <button
          onClick={() => setMode('text')}
          className={cn(
            'rounded-full px-4 py-1.5 text-sm font-medium transition-colors',
            mode === 'text' ? 'bg-amber-500 text-zinc-950' : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
          )}
        >
          Text to Emoji
        </button>
        <button
          onClick={() => setMode('image')}
          className={cn(
            'rounded-full px-4 py-1.5 text-sm font-medium transition-colors',
            mode === 'image' ? 'bg-amber-500 text-zinc-950' : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
          )}
        >
          Image to Emoji
        </button>
      </div>

      <div className="mt-6">{mode === 'text' ? <TextToEmojiForm /> : <ImageToEmojiForm />}</div>
    </div>
  );
}

function TextToEmojiForm() {
  const queryClient = useQueryClient();
  const [prompt, setPrompt] = useState('');
  const [style, setStyle] = useState<EmojiStyle>('emoji');
  const [expression, setExpression] = useState<EmojiExpression>('happy');
  const [background, setBackground] = useState<EmojiBackground>('transparent');

  const mutation = useMutation({
    mutationFn: () =>
      apiFetch<Emoji>('/api/v1/emojis/generate', {
        method: 'POST',
        body: JSON.stringify({ prompt, style, expression, background }),
      }),
    onSuccess: () => {
      toast.success('Emoji generated!');
      queryClient.invalidateQueries({ queryKey: ['emojis'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <div className="space-y-6">
      <Card className="space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-zinc-300">Prompt</label>
          <Textarea
            rows={3}
            placeholder="A grinning robot with heart eyes"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            maxLength={500}
          />
        </div>

        <div className="grid grid-cols-3 gap-3">
          <Field label="Style">
            <Select value={style} onChange={(e) => setStyle(e.target.value as EmojiStyle)}>
              {STYLE_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {getStyleDisplayName(s)}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Expression">
            <Select value={expression} onChange={(e) => setExpression(e.target.value as EmojiExpression)}>
              {EXPRESSION_OPTIONS.map((e) => (
                <option key={e} value={e}>
                  {getExpressionDisplayName(e)}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Background">
            <Select value={background} onChange={(e) => setBackground(e.target.value as EmojiBackground)}>
              {BACKGROUND_OPTIONS.map((b) => (
                <option key={b} value={b}>
                  {getBackgroundDisplayName(b)}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <Button
          className="w-full"
          disabled={!prompt.trim() || mutation.isPending}
          onClick={() => mutation.mutate()}
        >
          {mutation.isPending ? <Spinner /> : <Sparkles className="h-4 w-4" />}
          {mutation.isPending ? 'Generating…' : 'Generate emoji'}
        </Button>
      </Card>

      {mutation.data && <ResultCard emoji={mutation.data} />}
    </div>
  );
}

function ImageToEmojiForm() {
  const queryClient = useQueryClient();
  const [file, setFile] = useState<File | null>(null);
  const [prompt, setPrompt] = useState('');
  const [style, setStyle] = useState<EmojiStyle>('sticker');

  const mutation = useMutation({
    mutationFn: () => {
      const formData = new FormData();
      formData.append('file', file!);
      formData.append('prompt', prompt || 'Transform this image into an emoji');
      formData.append('style', style);
      return apiFetch<Emoji>('/api/v1/emojis/upload', { method: 'POST', body: formData });
    },
    onSuccess: () => {
      toast.success('Emoji created from your image!');
      queryClient.invalidateQueries({ queryKey: ['emojis'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <div className="space-y-6">
      <Card className="space-y-4">
        <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-zinc-700 py-10 text-zinc-400 hover:border-amber-400 hover:text-amber-400">
          <Upload className="h-6 w-6" />
          <span className="text-sm">{file ? file.name : 'Click to choose an image'}</span>
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            className="hidden"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
        </label>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-zinc-300">Direction (optional)</label>
          <Textarea
            rows={2}
            placeholder="Turn this into a glossy 3D sticker"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            maxLength={500}
          />
        </div>

        <Field label="Style">
          <Select value={style} onChange={(e) => setStyle(e.target.value as EmojiStyle)}>
            {STYLE_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {getStyleDisplayName(s)}
              </option>
            ))}
          </Select>
        </Field>

        <Button className="w-full" disabled={!file || mutation.isPending} onClick={() => mutation.mutate()}>
          {mutation.isPending ? <Spinner /> : <Upload className="h-4 w-4" />}
          {mutation.isPending ? 'Transforming…' : 'Transform image'}
        </Button>
      </Card>

      {mutation.data && <ResultCard emoji={mutation.data} />}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-zinc-400">{label}</label>
      {children}
    </div>
  );
}

function ResultCard({ emoji }: { emoji: Emoji }) {
  return (
    <Card className="flex items-center gap-4">
      <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-zinc-800">
        <Image src={emoji.imageUrl} alt={emoji.name} fill className="object-contain p-2" unoptimized />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-zinc-100">{emoji.name}</p>
        <p className="text-sm text-zinc-500">Saved to your library</p>
        <Link href={`/emoji/${emoji.id}`} className="mt-2 inline-block text-sm font-medium text-amber-400 hover:underline">
          View details →
        </Link>
      </div>
    </Card>
  );
}
