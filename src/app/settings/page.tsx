import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function SettingsPage() {
  const aiProvider = process.env.AI_PROVIDER || 'nvidia';
  const storageProvider = process.env.STORAGE_PROVIDER || 'local';
  const maxUploadMb = process.env.MAX_UPLOAD_SIZE_MB || '10';
  const hasNvidiaKey = Boolean(process.env.NVIDIA_API_KEY);

  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <h1 className="text-2xl font-semibold text-zinc-50">Settings</h1>
      <p className="mt-1 text-sm text-zinc-400">Current server configuration for this deployment.</p>

      <Card className="mt-6 space-y-4">
        <Row label="AI provider" value={aiProvider}>
          {!hasNvidiaKey && (
            <Badge className="border-amber-500/40 text-amber-400">no API key — using mock generation</Badge>
          )}
        </Row>
        <Row label="Storage provider" value={storageProvider} />
        <Row label="Max upload size" value={`${maxUploadMb} MB`} />
      </Card>

      <Card className="mt-4 text-sm text-zinc-400">
        Real user accounts and authentication are on the roadmap — for now, your emojis are tied to a private,
        cookie-based session on this device.
      </Card>
    </div>
  );
}

function Row({ label, value, children }: { label: string; value: string; children?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-zinc-400">{label}</span>
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-zinc-100">{value}</span>
        {children}
      </div>
    </div>
  );
}
