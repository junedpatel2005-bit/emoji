import {
  EmojiAIProvider,
  GenerateEmojiInput,
  TransformEmojiInput,
  GeneratedEmoji,
  AIProviderCapabilities,
  AIProviderError,
  AIErrorCode,
  createAIError,
} from '../types';

export class NVIDIAProvider implements EmojiAIProvider {
  readonly name = 'nvidia';
  // generateEmoji/transformEmoji always produce an image (falling back to a mock
  // placeholder when no real image-generation endpoint is configured), so these
  // stay true; the mock fallback itself is logged via console.warn.
  readonly capabilities: AIProviderCapabilities = {
    supportsImageGeneration: true,
    supportsImageEditing: true,
    supportsVision: false,
    maxImageSize: 1024,
    supportedFormats: ['png', 'webp', 'svg'],
  };

  private apiKey: string;
  private baseUrl: string;
  private model: string;

  constructor() {
    this.apiKey = process.env.NVIDIA_API_KEY || '';
    this.baseUrl = process.env.NVIDIA_BASE_URL || 'https://integrate.api.nvidia.com/v1';
    this.model = process.env.NVIDIA_MODEL || 'nvidia/llama-3.1-nemotron-70b-instruct';

    if (!this.apiKey) {
      console.warn('[NVIDIA] API key not configured. Image generation will use mock provider.');
    }
  }

  async checkHealth(): Promise<boolean> {
    if (!this.apiKey) return false;
    try {
      const response = await fetch(`${this.baseUrl}/models`, {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
        },
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  async generateEmoji(input: GenerateEmojiInput): Promise<GeneratedEmoji> {
    if (!this.apiKey) {
      return this.generateMockEmoji(input);
    }

    // NVIDIA's current API is primarily for text generation (LLMs)
    // Image generation would require a different model/endpoint
    // For now, we'll use a mock implementation
    console.warn('[NVIDIA] Image generation not yet supported with current model. Using mock.');
    return this.generateMockEmoji(input);
  }

  async transformEmoji(input: TransformEmojiInput): Promise<GeneratedEmoji> {
    if (!this.apiKey) {
      return this.generateMockEmoji({ prompt: input.prompt, style: input.style });
    }

    console.warn('[NVIDIA] Image editing not yet supported with current model. Using mock.');
    return this.generateMockEmoji({ prompt: input.prompt, style: input.style });
  }

  private async generateMockEmoji(input: GenerateEmojiInput): Promise<GeneratedEmoji> {
    // Generate a placeholder SVG as a mock emoji
    const width = input.width || input.outputSize || 512;
    const height = input.height || input.outputSize || 512;
    const style = input.style || 'emoji';
    const expression = input.expression || 'neutral';
    const background = input.background || 'transparent';

    const svg = this.generatePlaceholderSVG(width, height, style, expression, background, input.prompt);
    const buffer = Buffer.from(svg);
    const base64 = buffer.toString('base64');
    const dataUrl = `data:image/svg+xml;base64,${base64}`;

    return {
      imageUrl: dataUrl,
      thumbnailUrl: dataUrl,
      width,
      height,
      mimeType: 'image/svg+xml',
      fileSize: buffer.length,
      metadata: {
        mock: true,
        provider: 'nvidia',
        model: this.model,
        prompt: input.prompt,
        style,
        expression,
        background,
      },
    };
  }

  private generatePlaceholderSVG(
    width: number,
    height: number,
    style: string,
    expression: string,
    background: string,
    prompt: string
  ): string {
    const bgColor = background === 'transparent' ? 'none' : '#f0f0f0';
    const accentColor = this.getStyleColor(style);
    const expressionIcon = this.getExpressionIcon(expression);

    return `
<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="4" stdDeviation="8" flood-color="${accentColor}" flood-opacity="0.3"/>
    </filter>
    <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="4" result="blur"/>
      <feMerge>
        <feMergeNode in="blur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>
  
  ${background !== 'transparent' ? `<rect width="${width}" height="${height}" fill="${bgColor}" rx="24"/>` : ''}
  
  <circle 
    cx="${width / 2}" 
    cy="${height / 2}" 
    r="${Math.min(width, height) * 0.42}" 
    fill="${accentColor}" 
    filter="url(#shadow)"
    opacity="0.95"
  />
  
  <circle 
    cx="${width / 2}" 
    cy="${height / 2}" 
    r="${Math.min(width, height) * 0.35}" 
    fill="white" 
    opacity="0.15"
  />
  
  <text 
    x="${width / 2}" 
    y="${height / 2 + height * 0.12}" 
    text-anchor="middle" 
    dominant-baseline="middle"
    font-size="${Math.min(width, height) * 0.35}"
    font-family="system-ui, sans-serif"
    fill="white"
    filter="url(#glow)"
  >${expressionIcon}</text>
  
  <text 
    x="${width / 2}" 
    y="${height - height * 0.08}" 
    text-anchor="middle" 
    dominant-baseline="middle"
    font-size="${Math.min(width, height) * 0.06}"
    font-family="system-ui, sans-serif"
    fill="white"
    opacity="0.7"
  >${prompt.slice(0, 30)}${prompt.length > 30 ? '...' : ''}</text>
  
  <text 
    x="${width - width * 0.05}" 
    y="${height - height * 0.05}" 
    text-anchor="end" 
    dominant-baseline="end"
    font-size="${Math.min(width, height) * 0.045}"
    font-family="system-ui, sans-serif"
    fill="white"
    opacity="0.5"
  >[MOCK]</text>
</svg>`.trim();
  }

  private getStyleColor(style: string): string {
    const colors: Record<string, string> = {
      emoji: '#FFD700',
      emoji_3d: '#FF6B35',
      sticker: '#4ECDC4',
      cartoon: '#FF6B9D',
      pixel: '#74B9FF',
      minimal: '#A29BFE',
      clay: '#FD79A8',
      glossy: '#00CEC9',
    };
    return colors[style] || '#FFD700';
  }

  private getExpressionIcon(expression: string): string {
    const icons: Record<string, string> = {
      happy: '😊',
      laughing: '😂',
      angry: '😠',
      sad: '😢',
      cool: '😎',
      surprised: '😲',
      neutral: '😐',
      custom: '✨',
    };
    return icons[expression] || '😐';
  }
}

export function createNVIDIAProvider(): NVIDIAProvider {
  return new NVIDIAProvider();
}