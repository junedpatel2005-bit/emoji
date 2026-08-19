import {
  EmojiAIProvider,
  GenerateEmojiInput,
  TransformEmojiInput,
  GeneratedEmoji,
  AIProviderCapabilities,
  AIProviderError,
  AIErrorCode,
  createAIError,
  isAIProviderError,
} from './types';
import { NVIDIAProvider, createNVIDIAProvider } from './providers/nvidia';

let providerInstance: EmojiAIProvider | null = null;

export function getAIProvider(): EmojiAIProvider {
  if (!providerInstance) {
    providerInstance = createProvider();
  }
  return providerInstance;
}

export function setAIProvider(provider: EmojiAIProvider): void {
  providerInstance = provider;
}

function createProvider(): EmojiAIProvider {
  const providerName = process.env.AI_PROVIDER || 'nvidia';
  
  switch (providerName.toLowerCase()) {
    case 'nvidia':
      return createNVIDIAProvider();
    case 'mock':
      return createMockProvider();
    default:
      console.warn(`[AI] Unknown provider "${providerName}", falling back to NVIDIA`);
      return createNVIDIAProvider();
  }
}

function createMockProvider(): EmojiAIProvider {
  return {
    name: 'mock',
    capabilities: {
      supportsImageGeneration: true,
      supportsImageEditing: true,
      supportsVision: false,
      maxImageSize: 1024,
      supportedFormats: ['png', 'webp', 'svg'],
    },
    async generateEmoji(input: GenerateEmojiInput): Promise<GeneratedEmoji> {
      const nvidiaProvider = createNVIDIAProvider();
      return nvidiaProvider.generateEmoji(input);
    },
    async transformEmoji(input: TransformEmojiInput): Promise<GeneratedEmoji> {
      const nvidiaProvider = createNVIDIAProvider();
      return nvidiaProvider.transformEmoji(input);
    },
    async checkHealth(): Promise<boolean> {
      return true;
    },
  };
}

export async function generateEmoji(input: GenerateEmojiInput): Promise<GeneratedEmoji> {
  const provider = getAIProvider();
  
  if (!provider.capabilities.supportsImageGeneration) {
    throw createAIError(
      'Image generation is not supported by the current AI provider',
      'UNSUPPORTED_CAPABILITY',
      provider.name
    );
  }
  
  try {
    return await provider.generateEmoji(input);
  } catch (error) {
    if (isAIProviderError(error)) {
      throw error;
    }
    throw createAIError(
      'Failed to generate emoji',
      'GENERATION_FAILED',
      provider.name,
      undefined,
      error instanceof Error ? error : undefined
    );
  }
}

export async function transformEmoji(input: TransformEmojiInput): Promise<GeneratedEmoji> {
  const provider = getAIProvider();
  
  if (!provider.capabilities.supportsImageEditing) {
    throw createAIError(
      'Image editing is not supported by the current AI provider',
      'UNSUPPORTED_CAPABILITY',
      provider.name
    );
  }
  
  if (!provider.transformEmoji) {
    throw createAIError(
      'Image editing is not implemented by the current AI provider',
      'UNSUPPORTED_CAPABILITY',
      provider.name
    );
  }
  
  try {
    return await provider.transformEmoji(input);
  } catch (error) {
    if (isAIProviderError(error)) {
      throw error;
    }
    throw createAIError(
      'Failed to transform emoji',
      'GENERATION_FAILED',
      provider.name,
      undefined,
      error instanceof Error ? error : undefined
    );
  }
}

export async function checkAIHealth(): Promise<{ healthy: boolean; provider: string }> {
  const provider = getAIProvider();
  const healthy = await provider.checkHealth();
  return { healthy, provider: provider.name };
}

export type { AIProviderError, AIErrorCode, EmojiAIProvider, GenerateEmojiInput, TransformEmojiInput, GeneratedEmoji, AIProviderCapabilities };
export { isAIProviderError, createAIError };
