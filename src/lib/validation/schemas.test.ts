import { describe, it, expect } from 'vitest';
import {
  generateEmojiSchema,
  transformEmojiSchema,
  uploadImageSchema,
  createEmojiSchema,
  updateEmojiSchema,
  createCollectionSchema,
  emojiQuerySchema,
  usageEventSchema,
} from './schemas';

describe('Validation Schemas', () => {
  describe('generateEmojiSchema', () => {
    it('should validate a valid prompt', () => {
      const result = generateEmojiSchema.safeParse({
        prompt: 'A cute robot face',
      });
      expect(result.success).toBe(true);
    });

    it('should reject empty prompt', () => {
      const result = generateEmojiSchema.safeParse({
        prompt: '',
      });
      expect(result.success).toBe(false);
    });

    it('should reject prompt too long', () => {
      const result = generateEmojiSchema.safeParse({
        prompt: 'a'.repeat(501),
      });
      expect(result.success).toBe(false);
    });

    it('should accept optional fields', () => {
      const result = generateEmojiSchema.safeParse({
        prompt: 'A cute robot face',
        style: 'emoji',
        expression: 'happy',
        background: 'transparent',
        aspectRatio: '1:1',
        outputSize: 512,
        width: 512,
        height: 512,
        seed: 12345,
        steps: 30,
        guidanceScale: 7.5,
      });
      expect(result.success).toBe(true);
    });
  });

  describe('transformEmojiSchema', () => {
    it('should validate valid transform input', () => {
      const result = transformEmojiSchema.safeParse({
        imageUrl: 'https://example.com/image.png',
        prompt: 'Turn into emoji style',
      });
      expect(result.success).toBe(true);
    });

    it('should reject invalid URL', () => {
      const result = transformEmojiSchema.safeParse({
        imageUrl: 'not-a-url',
        prompt: 'Turn into emoji style',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('uploadImageSchema', () => {
    it('should validate valid upload input', () => {
      const result = uploadImageSchema.safeParse({
        filename: 'test.png',
        mimeType: 'image/png',
        size: 1024 * 1024,
      });
      expect(result.success).toBe(true);
    });

    it('should reject invalid mime type', () => {
      const result = uploadImageSchema.safeParse({
        filename: 'test.txt',
        mimeType: 'text/plain',
        size: 1024,
      });
      expect(result.success).toBe(false);
    });

    it('should reject file too large', () => {
      const result = uploadImageSchema.safeParse({
        filename: 'test.png',
        mimeType: 'image/png',
        size: 11 * 1024 * 1024,
      });
      expect(result.success).toBe(false);
    });
  });

  describe('createEmojiSchema', () => {
    it('should validate valid emoji creation', () => {
      const result = createEmojiSchema.safeParse({
        name: 'My Robot',
        prompt: 'A cute robot',
        imageUrl: 'https://example.com/robot.png',
        width: 512,
        height: 512,
        fileSize: 102400,
      });
      expect(result.success).toBe(true);
    });

    it('should reject missing required fields', () => {
      const result = createEmojiSchema.safeParse({
        name: 'My Robot',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('updateEmojiSchema', () => {
    it('should accept partial updates', () => {
      const result = updateEmojiSchema.safeParse({
        name: 'Updated Name',
        favorite: true,
      });
      expect(result.success).toBe(true);
    });

    it('should reject empty name', () => {
      const result = updateEmojiSchema.safeParse({
        name: '',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('createCollectionSchema', () => {
    it('should validate valid collection', () => {
      const result = createCollectionSchema.safeParse({
        name: 'My Collection',
        description: 'A collection of emojis',
      });
      expect(result.success).toBe(true);
    });

    it('should reject empty name', () => {
      const result = createCollectionSchema.safeParse({
        name: '',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('emojiQuerySchema', () => {
    it('should use defaults', () => {
      const result = emojiQuerySchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(1);
        expect(result.data.limit).toBe(24);
        expect(result.data.sort).toBe('newest');
      }
    });

    it('should accept valid query params', () => {
      const result = emojiQuerySchema.safeParse({
        page: 2,
        limit: 50,
        search: 'robot',
        favorite: true,
        sourceType: 'generated',
        style: 'emoji',
        sort: 'oldest',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('usageEventSchema', () => {
    it('should validate valid usage event', () => {
      const result = usageEventSchema.safeParse({
        emojiId: 'clx1234567890abcdef',
        action: 'copy',
      });
      expect(result.success).toBe(true);
    });

    it('should reject invalid action', () => {
      const result = usageEventSchema.safeParse({
        emojiId: 'clx1234567890abcdef',
        action: 'invalid',
      });
      expect(result.success).toBe(false);
    });
  });
});