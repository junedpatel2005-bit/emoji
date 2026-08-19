import { GenerateEmojiInput, EmojiStyle, EmojiExpression, EmojiBackground } from './types';

export interface PromptTemplate {
  system: string;
  user: string;
  negative?: string;
}

export const STYLE_PROMPTS: Record<EmojiStyle, string> = {
  emoji: 'Apple-style emoji, clean vector art, bold outlines, vibrant colors, simple shapes, highly readable at small sizes',
  emoji_3d: '3D emoji render, octane render, clay material, soft studio lighting, subtle subsurface scattering, rounded forms, playful',
  sticker: 'sticker style, thick white outline, die-cut sticker look, flat colors, bold simple shapes, print-ready',
  cartoon: 'cartoon illustration, cel shaded, expressive features, exaggerated proportions, clean line art, vibrant palette',
  pixel: 'pixel art, 32x32 pixel perfect, retro game aesthetic, limited palette, crisp edges, nostalgic',
  minimal: 'minimalist line art, single continuous line, negative space, elegant simplicity, monochrome with single accent color',
  clay: 'claymation style, soft clay material, fingerprints visible, warm studio lighting, tactile, stop-motion aesthetic',
  glossy: 'glossy 3D icon, high specular highlights, glass-like material, reflective surfaces, premium app icon quality',
};

export const EXPRESSION_PROMPTS: Record<EmojiExpression, string> = {
  happy: 'smiling, cheerful, upturned mouth, bright eyes, joyful',
  laughing: 'laughing hard, mouth wide open, tears of joy, squinted eyes',
  angry: 'angry, furrowed brow, downturned mouth, intense eyes, steam from ears',
  sad: 'sad, downturned mouth, teary eyes, drooping features, melancholic',
  cool: 'cool, sunglasses, slight smirk, confident pose, relaxed',
  surprised: 'surprised, wide eyes, open mouth, raised eyebrows, shocked',
  neutral: 'neutral expression, straight mouth, calm eyes, peaceful',
  custom: '',
};

export const BACKGROUND_PROMPTS: Record<EmojiBackground, string> = {
  transparent: 'isolated on transparent background, no background, alpha channel',
  solid: 'solid color background, clean single color backdrop',
  gradient: 'subtle gradient background, soft color transition',
};

export function buildGenerationPrompt(input: GenerateEmojiInput): { prompt: string; negativePrompt: string } {
  const { prompt: userPrompt, style, expression, background, negativePrompt } = input;
  
  const stylePrompt = style ? STYLE_PROMPTS[style] : STYLE_PROMPTS.emoji;
  const expressionPrompt = expression ? EXPRESSION_PROMPTS[expression] : '';
  const backgroundPrompt = background ? BACKGROUND_PROMPTS[background] : BACKGROUND_PROMPTS.transparent;
  
  const parts = [
    'Create a single centered emoji-style icon',
    `of ${userPrompt}`,
    stylePrompt,
    expressionPrompt && `with ${expressionPrompt} expression`,
    backgroundPrompt,
    'high detail, polished, professional quality',
    'visually readable at 64px',
    'clean silhouette, no text, no watermark, no signature',
  ].filter(Boolean);
  
  const fullPrompt = parts.join(', ') + '.';
  
  const defaultNegative = [
    'text, watermark, signature, logo, branding',
    'multiple objects, cluttered, busy composition',
    'photorealistic, photograph, 3d render artifacts',
    'low quality, blurry, pixelated, jpeg artifacts',
    'ugly, deformed, distorted, mutated',
    'extra limbs, missing features, asymmetry',
    'background, scenery, environment, landscape',
    'border, frame, outline (unless sticker style)',
  ].join(', ');
  
  return {
    prompt: fullPrompt,
    negativePrompt: negativePrompt || defaultNegative,
  };
}

export function buildTransformationPrompt(input: { prompt: string; style?: EmojiStyle; expression?: EmojiExpression; background?: EmojiBackground }): { prompt: string; negativePrompt: string } {
  const { prompt: userPrompt, style, expression, background } = input;
  
  const stylePrompt = style ? STYLE_PROMPTS[style] : STYLE_PROMPTS.emoji;
  const expressionPrompt = expression ? EXPRESSION_PROMPTS[expression] : '';
  const backgroundPrompt = background ? BACKGROUND_PROMPTS[background] : BACKGROUND_PROMPTS.transparent;
  
  const parts = [
    'Transform the input image into an emoji-style icon',
    `following this direction: ${userPrompt}`,
    stylePrompt,
    expressionPrompt && `with ${expressionPrompt} expression`,
    backgroundPrompt,
    'preserve key recognizable features',
    'clean silhouette, high detail, polished',
    'visually readable at 64px',
    'no text, no watermark, no signature',
  ].filter(Boolean);
  
  const fullPrompt = parts.join(', ') + '.';
  
  const defaultNegative = [
    'text, watermark, signature, logo, branding',
    'photorealistic, photograph',
    'low quality, blurry, pixelated, jpeg artifacts',
    'ugly, deformed, distorted, mutated',
    'background, scenery, environment, landscape',
  ].join(', ');
  
  return {
    prompt: fullPrompt,
    negativePrompt: defaultNegative,
  };
}

export function getStyleDisplayName(style: EmojiStyle): string {
  const names: Record<EmojiStyle, string> = {
    emoji: 'Emoji',
    emoji_3d: '3D Emoji',
    sticker: 'Sticker',
    cartoon: 'Cartoon',
    pixel: 'Pixel Art',
    minimal: 'Minimal',
    clay: 'Clay',
    glossy: 'Glossy',
  };
  return names[style];
}

export function getExpressionDisplayName(expression: EmojiExpression): string {
  const names: Record<EmojiExpression, string> = {
    happy: 'Happy',
    laughing: 'Laughing',
    angry: 'Angry',
    sad: 'Sad',
    cool: 'Cool',
    surprised: 'Surprised',
    neutral: 'Neutral',
    custom: 'Custom',
  };
  return names[expression];
}

export function getBackgroundDisplayName(background: EmojiBackground): string {
  const names: Record<EmojiBackground, string> = {
    transparent: 'Transparent',
    solid: 'Solid Color',
    gradient: 'Gradient',
  };
  return names[background];
}