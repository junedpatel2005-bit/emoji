export interface GenerateEmojiInput {
  prompt: string;
  negativePrompt?: string;
  style?: EmojiStyle;
  expression?: EmojiExpression;
  background?: EmojiBackground;
  aspectRatio?: string;
  outputSize?: number;
  width?: number;
  height?: number;
  seed?: number;
  steps?: number;
  guidanceScale?: number;
}

export interface TransformEmojiInput {
  imageUrl: string;
  prompt: string;
  negativePrompt?: string;
  style?: EmojiStyle;
  expression?: EmojiExpression;
  background?: EmojiBackground;
  strength?: number;
  seed?: number;
  steps?: number;
  guidanceScale?: number;
}

export interface GeneratedEmoji {
  imageUrl: string;
  thumbnailUrl?: string;
  width: number;
  height: number;
  mimeType: string;
  fileSize: number;
  metadata?: Record<string, unknown>;
}

export type EmojiStyle =
  | 'emoji'
  | 'emoji_3d'
  | 'sticker'
  | 'cartoon'
  | 'pixel'
  | 'minimal'
  | 'clay'
  | 'glossy';

export type EmojiExpression =
  | 'happy'
  | 'laughing'
  | 'angry'
  | 'sad'
  | 'cool'
  | 'surprised'
  | 'neutral'
  | 'custom';

export type EmojiBackground =
  | 'transparent'
  | 'solid'
  | 'gradient';

export interface AIProviderCapabilities {
  supportsImageGeneration: boolean;
  supportsImageEditing: boolean;
  supportsVision: boolean;
  maxImageSize?: number;
  supportedFormats?: string[];
}

export interface EmojiAIProvider {
  readonly name: string;
  readonly capabilities: AIProviderCapabilities;
  generateEmoji(input: GenerateEmojiInput): Promise<GeneratedEmoji>;
  transformEmoji?(input: TransformEmojiInput): Promise<GeneratedEmoji>;
  checkHealth(): Promise<boolean>;
}

export class AIProviderError extends Error {
  constructor(
    message: string,
    public readonly code: AIErrorCode,
    public readonly provider: string,
    public readonly statusCode?: number,
    public readonly originalError?: Error
  ) {
    super(message);
    this.name = 'AIProviderError';
  }
}

export type AIErrorCode =
  | 'AUTHENTICATION_ERROR'
  | 'RATE_LIMIT'
  | 'INVALID_REQUEST'
  | 'UNSUPPORTED_CAPABILITY'
  | 'PROVIDER_UNAVAILABLE'
  | 'CONTENT_REJECTED'
  | 'GENERATION_FAILED'
  | 'INVALID_IMAGE'
  | 'IMAGE_TOO_LARGE'
  | 'UNKNOWN_ERROR';

export function isAIProviderError(error: unknown): error is AIProviderError {
  return error instanceof AIProviderError;
}

export function createAIError(
  message: string,
  code: AIErrorCode,
  provider: string,
  statusCode?: number,
  originalError?: Error
): AIProviderError {
  return new AIProviderError(message, code, provider, statusCode, originalError);
}