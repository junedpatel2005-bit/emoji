import { z } from 'zod';

const styleValues = ['emoji', 'emoji_3d', 'sticker', 'cartoon', 'pixel', 'minimal', 'clay', 'glossy'] as const;
const expressionValues = ['happy', 'laughing', 'angry', 'sad', 'cool', 'surprised', 'neutral', 'custom'] as const;
const backgroundValues = ['transparent', 'solid', 'gradient'] as const;
const statusValues = ['pending', 'processing', 'completed', 'failed'] as const;
const sourceTypeValues = ['generated', 'uploaded', 'transformed'] as const;
const mimeTypeValues = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'] as const;
const sortValues = ['newest', 'oldest', 'mostUsed', 'name'] as const;
const actionValues = ['copy', 'download', 'view', 'favorite', 'share'] as const;

export const generateEmojiSchema = z.object({
  prompt: z.string().min(1, 'Prompt is required').max(500, 'Prompt too long'),
  negativePrompt: z.string().max(500).optional(),
  style: z.enum(styleValues).optional(),
  expression: z.enum(expressionValues).optional(),
  background: z.enum(backgroundValues).optional(),
  aspectRatio: z.string().regex(/^\d+:\d+$/).optional(),
  outputSize: z.number().int().min(64).max(1024).optional(),
  width: z.number().int().min(64).max(1024).optional(),
  height: z.number().int().min(64).max(1024).optional(),
  seed: z.number().int().optional(),
  steps: z.number().int().min(1).max(100).optional(),
  guidanceScale: z.number().min(1).max(20).optional(),
});

export const transformEmojiSchema = z.object({
  imageUrl: z.string().url('Invalid image URL'),
  prompt: z.string().min(1, 'Prompt is required').max(500, 'Prompt too long'),
  negativePrompt: z.string().max(500).optional(),
  style: z.enum(styleValues).optional(),
  expression: z.enum(expressionValues).optional(),
  background: z.enum(backgroundValues).optional(),
  strength: z.number().min(0).max(1).optional(),
  seed: z.number().int().optional(),
  steps: z.number().int().min(1).max(100).optional(),
  guidanceScale: z.number().min(1).max(20).optional(),
});

export const uploadImageSchema = z.object({
  filename: z.string().min(1).max(255),
  mimeType: z.enum(mimeTypeValues),
  size: z.number().int().positive().max(10 * 1024 * 1024), // 10MB
});

export const createEmojiSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  prompt: z.string().max(500).optional(),
  negativePrompt: z.string().max(500).optional(),
  generationPrompt: z.string().max(1000).optional(),
  imageUrl: z.string().url('Invalid image URL'),
  thumbnailUrl: z.string().url().optional(),
  originalImageUrl: z.string().url().optional(),
  mimeType: z.string().default('image/png'),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  fileSize: z.number().int().positive(),
  provider: z.string().optional(),
  model: z.string().optional(),
  status: z.enum(statusValues).default('completed'),
  sourceType: z.enum(sourceTypeValues).default('generated'),
  style: z.enum(styleValues).optional(),
  expression: z.enum(expressionValues).optional(),
  background: z.enum(backgroundValues).default('transparent'),
  favorite: z.boolean().default(false),
  parentEmojiId: z.string().cuid().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const updateEmojiSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  prompt: z.string().max(500).optional(),
  negativePrompt: z.string().max(500).optional(),
  favorite: z.boolean().optional(),
  style: z.enum(styleValues).optional(),
  expression: z.enum(expressionValues).optional(),
  background: z.enum(backgroundValues).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const createCollectionSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  description: z.string().max(500).optional(),
});

export const updateCollectionSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
});

export const addEmojiToCollectionSchema = z.object({
  emojiId: z.string().cuid(),
  order: z.number().int().nonnegative().optional(),
});

export const reorderCollectionEmojisSchema = z.object({
  emojiIds: z.array(z.string().cuid()).min(1),
});

export const emojiQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(24),
  search: z.string().optional(),
  favorite: z.coerce.boolean().optional(),
  sourceType: z.enum(sourceTypeValues).optional(),
  style: z.enum(styleValues).optional(),
  sort: z.enum(sortValues).default('newest'),
  collectionId: z.string().cuid().optional(),
});

export const usageEventSchema = z.object({
  emojiId: z.string().cuid(),
  action: z.enum(actionValues),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export type GenerateEmojiInput = z.infer<typeof generateEmojiSchema>;
export type TransformEmojiInput = z.infer<typeof transformEmojiSchema>;
export type UploadImageInput = z.infer<typeof uploadImageSchema>;
export type CreateEmojiInput = z.infer<typeof createEmojiSchema>;
export type UpdateEmojiInput = z.infer<typeof updateEmojiSchema>;
export type CreateCollectionInput = z.infer<typeof createCollectionSchema>;
export type UpdateCollectionInput = z.infer<typeof updateCollectionSchema>;
export type AddEmojiToCollectionInput = z.infer<typeof addEmojiToCollectionSchema>;
export type ReorderCollectionEmojisInput = z.infer<typeof reorderCollectionEmojisSchema>;
export type EmojiQueryInput = z.infer<typeof emojiQuerySchema>;
export type UsageEventInput = z.infer<typeof usageEventSchema>;
