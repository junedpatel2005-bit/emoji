# EmojAI

**Create any emoji you can imagine.**

An AI-powered custom emoji platform built with Next.js 16, Prisma ORM, PostgreSQL, and NVIDIA AI.

## Features

- **Text-to-Emoji**: Generate custom emojis from text prompts with style, expression, and background options
- **Image-to-Emoji**: Transform uploaded images into polished emojis
- **Personal Library**: Manage your emoji collection with favorites, search, filters, and sorting
- **Collections**: Organize emojis into custom collections
- **Keyboard Preview**: Browser-based keyboard prototype for future mobile integration
- **Dark/Light Mode**: Full theme support
- **Responsive Design**: Mobile-first, works on all devices

## Tech Stack

- **Framework**: Next.js 16 (App Router, Turbopack)
- **Language**: TypeScript (strict mode)
- **Database**: PostgreSQL with Prisma ORM 7
- **Styling**: Tailwind CSS 4 + shadcn/ui
- **AI**: NVIDIA AI API (OpenAI-compatible)
- **State**: TanStack Query
- **Forms**: React Hook Form + Zod
- **Testing**: Vitest + React Testing Library
- **Icons**: Lucide React

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL database (local or cloud: Neon, Supabase, Railway, etc.)
- NVIDIA API key (or use mock provider for development)

### Installation

```bash
# Clone and install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Edit .env with your configuration
# Required: DATABASE_URL, NVIDIA_API_KEY (or use AI_PROVIDER=mock)

# Generate Prisma client
npm run db:generate

# Run database migrations
npm run db:migrate

# (Optional) Seed database with demo data
npm run db:seed

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | Yes (production) |
| `NVIDIA_API_KEY` | NVIDIA API key | Yes (for AI generation) |
| `NVIDIA_BASE_URL` | NVIDIA API base URL | No (defaults to NVIDIA) |
| `NVIDIA_MODEL` | Model to use | No |
| `AI_PROVIDER` | AI provider: `nvidia` or `mock` | No (defaults to `nvidia`) |
| `NEXT_PUBLIC_APP_URL` | App URL for client | No |
| `STORAGE_PROVIDER` | Storage: `local`, `s3`, `r2`, `supabase`, `vercel-blob` | No (defaults to `local`) |
| `MAX_UPLOAD_SIZE_MB` | Max upload size in MB | No (defaults to `10`) |

### Development without Database

Set `AI_PROVIDER=mock` in `.env` to use a mock AI provider that doesn't require a database connection. This allows UI development without PostgreSQL.

```env
AI_PROVIDER=mock
```

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── api/v1/            # API routes
│   ├── create/            # Emoji creation studio
│   ├── library/           # Personal emoji library
│   ├── collections/       # Collections management
│   ├── keyboard/          # Keyboard preview
│   ├── dashboard/         # User dashboard
│   ├── settings/          # Settings page
│   └── emoji/[id]/        # Emoji detail page
├── components/            # Shared UI components
├── features/              # Feature-specific components
│   ├── emoji/
│   ├── collections/
│   └── keyboard/
├── lib/                   # Core libraries
│   ├── ai/               # AI provider abstraction
│   │   ├── providers/    # Provider implementations
│   │   ├── types.ts      # AI types
│   │   ├── prompts.ts    # Prompt engineering
│   │   └── provider.ts   # Provider factory
│   ├── auth/             # Authentication (extensible)
│   ├── db/               # Prisma client
│   ├── storage/          # Storage abstraction
│   ├── image/            # Image processing
│   ├── validation/       # Zod schemas
│   └── rate-limit/       # Rate limiting
├── server/               # Server-only code
│   ├── services/         # Business logic
│   └── repositories/     # Data access
└── types/                # Shared TypeScript types
```

## Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Production build
npm run start        # Start production server
npm run lint         # Run ESLint
npm run typecheck    # TypeScript type checking
npm run test         # Run tests
npm run test:watch   # Watch mode tests
npm run test:ui      # Test UI
npm run db:generate  # Generate Prisma client
npm run db:migrate   # Run migrations
npm run db:seed      # Seed database
npm run db:studio    # Open Prisma Studio
```

## Architecture

### AI Provider Abstraction

The AI system uses a provider pattern for easy swapping:

```typescript
interface EmojiAIProvider {
  name: string;
  capabilities: AIProviderCapabilities;
  generateEmoji(input: GenerateEmojiInput): Promise<GeneratedEmoji>;
  transformEmoji?(input: TransformEmojiInput): Promise<GeneratedEmoji>;
  checkHealth(): Promise<boolean>;
}
```

Supported providers:
- **NVIDIA** (default): Uses NVIDIA's OpenAI-compatible API
- **Mock**: Development provider that returns placeholder images

### Storage Abstraction

```typescript
interface StorageProvider {
  upload(input: UploadFile): Promise<UploadResult>;
  delete(key: string): Promise<void>;
  getPublicUrl(key: string): string;
  getSignedUrl(key: string, expiresIn?: number): Promise<string>;
  exists(key: string): Promise<boolean>;
  getMetadata(key: string): Promise<FileMetadata>;
}
```

Supported providers:
- **Local** (default): Filesystem storage for development
- **S3**, **R2**, **Supabase**, **Vercel Blob**: Production-ready (to be implemented)

### Database Schema

Key models:
- **User**: Authentication and profile
- **Emoji**: Generated/uploaded emojis with metadata
- **Collection**: User-created emoji collections
- **CollectionEmoji**: Join table with ordering
- **GenerationJob**: Async generation tracking
- **EmojiUsage**: Analytics for keyboard integration

## API Endpoints

```
POST   /api/v1/emojis/generate     # Generate emoji from text
POST   /api/v1/emojis/upload       # Upload image for transformation
POST   /api/v1/emojis/:id/variation # Create variation

GET    /api/v1/emojis              # List emojis (with filters)
GET    /api/v1/emojis/:id          # Get emoji details
PATCH  /api/v1/emojis/:id          # Update emoji
DELETE /api/v1/emojis/:id          # Delete emoji

POST   /api/v1/emojis/:id/favorite # Toggle favorite
POST   /api/v1/emojis/:id/usage    # Track usage

GET    /api/v1/collections         # List collections
POST   /api/v1/collections         # Create collection
PATCH  /api/v1/collections/:id     # Update collection
DELETE /api/v1/collections/:id     # Delete collection
```

## Mobile-Ready Architecture

The backend is designed for future mobile clients:

- Token-based authentication ready
- RESTful API with consistent responses
- Emoji library accessible via `GET /api/v1/emojis?favorite=true`
- Usage tracking for analytics
- Collections sync across devices

## Security

- Server-only secret handling
- MIME type validation on uploads
- File size limits
- Filename sanitization
- Server-side Zod validation
- Ownership checks on all mutations
- Rate limiting abstraction
- No secrets in client bundles
- Safe error responses (no stack traces)

## Testing

```bash
# Run all tests
npm run test

# Watch mode
npm run test:watch

# UI mode
npm run test:ui
```

Tests cover:
- Validation schemas
- AI provider abstraction
- Storage abstraction
- Prompt builder
- API behavior
- Security checks

## Deployment

### Vercel (Recommended)

1. Connect repository to Vercel
2. Add environment variables
3. Deploy

### Docker

```dockerfile
# Build
docker build -t emojai .

# Run
docker run -p 3000:3000 --env-file .env emojai
```

### Database

Use a managed PostgreSQL provider:
- **Neon** (serverless, generous free tier)
- **Supabase** (PostgreSQL + auth + storage)
- **Railway** (simple deployment)
- **PlanetScale** (MySQL-compatible, requires adapter change)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make changes with tests
4. Run `npm run lint && npm run typecheck && npm run test`
5. Submit a PR

## License

MIT License - see LICENSE file for details.

## Roadmap

- [ ] Real authentication (NextAuth.js)
- [ ] Background removal integration
- [ ] S3/R2/Supabase storage providers
- [ ] Android IME keyboard
- [ ] iOS keyboard extension
- [ ] Browser extension
- [ ] Discord/Slack integrations
- [ ] Emoji animation support
- [ ] Collaborative collections
- [ ] Public emoji marketplace#   e m o j i  
 