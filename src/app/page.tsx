import Link from 'next/link';
import { Sparkles, ImageIcon, Layers, Keyboard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

const FEATURES = [
  {
    icon: Sparkles,
    title: 'Text-to-Emoji',
    description: 'Describe anything and generate a custom emoji in seconds — style, expression, and background included.',
  },
  {
    icon: ImageIcon,
    title: 'Image-to-Emoji',
    description: 'Upload a photo and transform it into a polished, ready-to-use emoji.',
  },
  {
    icon: Layers,
    title: 'Collections',
    description: 'Organize your generated emojis into collections and keep your favorites close at hand.',
  },
  {
    icon: Keyboard,
    title: 'Keyboard Preview',
    description: 'Try a browser-based keyboard prototype of your emoji library, built for future mobile integration.',
  },
];

export default function Home() {
  return (
    <div className="flex flex-col items-center">
      <section className="flex w-full max-w-3xl flex-col items-center gap-6 px-6 py-24 text-center">
        <span className="rounded-full border border-zinc-800 bg-zinc-900 px-3 py-1 text-xs font-medium text-amber-400">
          AI-powered emoji generation
        </span>
        <h1 className="text-5xl font-semibold tracking-tight text-zinc-50 sm:text-6xl">EmojAI</h1>
        <p className="max-w-xl text-lg leading-8 text-zinc-400">
          <strong className="text-zinc-100">Create any emoji you can imagine.</strong> Describe it, generate it,
          and drop it straight into your library — no design skills required.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link href="/create">
            <Button size="lg">Start creating</Button>
          </Link>
          <Link href="/library">
            <Button size="lg" variant="outline">
              View library
            </Button>
          </Link>
        </div>
      </section>

      <section className="grid w-full max-w-5xl grid-cols-1 gap-4 px-6 pb-24 sm:grid-cols-2">
        {FEATURES.map(({ icon: Icon, title, description }) => (
          <Card key={title} className="flex items-start gap-4">
            <div className="rounded-xl bg-amber-500/10 p-2.5 text-amber-400">
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-semibold text-zinc-100">{title}</h2>
              <p className="mt-1 text-sm text-zinc-400">{description}</p>
            </div>
          </Card>
        ))}
      </section>
    </div>
  );
}
