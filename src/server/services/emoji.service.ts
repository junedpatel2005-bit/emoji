import { prisma } from '@/lib/db/prisma';
import { generateEmoji, transformEmoji, getAIProvider } from '@/lib/ai/provider';
import { uploadFile, deleteFile, getStorageProvider } from '@/lib/storage';
import { slugify } from '@/lib/utils';
import { NotFoundError, ForbiddenError } from '@/lib/api/response';
import type {
  GenerateEmojiInput,
  TransformEmojiInput,
  EmojiQueryInput,
  UpdateEmojiInput,
  UsageEventInput,
} from '@/lib/validation/schemas';
import type { Prisma } from '@/generated/prisma/client';

function dataUrlToBuffer(dataUrl: string): { buffer: Buffer; mimeType: string } {
  const match = /^data:([^;]+);base64,(.+)$/.exec(dataUrl);
  if (!match) {
    throw new Error('Unsupported generated image format');
  }
  return { mimeType: match[1], buffer: Buffer.from(match[2], 'base64') };
}

async function assertOwnedEmoji(userId: string, id: string) {
  const emoji = await prisma.emoji.findUnique({ where: { id } });
  if (!emoji) throw new NotFoundError('Emoji not found');
  if (emoji.userId !== userId) throw new ForbiddenError('You do not own this emoji');
  return emoji;
}

export async function generateAndSaveEmoji(userId: string, input: GenerateEmojiInput) {
  const provider = getAIProvider();

  const job = await prisma.generationJob.create({
    data: {
      userId,
      provider: provider.name,
      model: 'unknown',
      prompt: input.prompt,
      input: input as Prisma.InputJsonValue,
      status: 'processing',
      startedAt: new Date(),
    },
  });

  try {
    const result = await generateEmoji(input);
    const { buffer, mimeType } = dataUrlToBuffer(result.imageUrl);
    const ext = mimeType.split('/')[1] ?? 'png';
    const upload = await uploadFile(buffer, `emoji.${ext}`, mimeType);

    const emoji = await prisma.emoji.create({
      data: {
        userId,
        name: input.prompt.slice(0, 80),
        slug: slugify(input.prompt),
        prompt: input.prompt,
        negativePrompt: input.negativePrompt,
        imageUrl: upload.url,
        thumbnailUrl: upload.url,
        mimeType,
        width: upload.width ?? result.width,
        height: upload.height ?? result.height,
        fileSize: upload.size,
        provider: provider.name,
        status: 'completed',
        sourceType: 'generated',
        style: input.style,
        expression: input.expression,
        background: input.background ?? 'transparent',
        metadata: (result.metadata as Prisma.InputJsonValue) ?? undefined,
      },
    });

    await prisma.generationJob.update({
      where: { id: job.id },
      data: {
        status: 'completed',
        emojiId: emoji.id,
        completedAt: new Date(),
        output: { imageUrl: upload.url } as Prisma.InputJsonValue,
      },
    });

    return emoji;
  } catch (error) {
    await prisma.generationJob.update({
      where: { id: job.id },
      data: {
        status: 'failed',
        completedAt: new Date(),
        error: error instanceof Error ? error.message : 'Unknown error',
      },
    });
    throw error;
  }
}

export async function transformAndSaveEmoji(
  userId: string,
  file: { buffer: Buffer; filename: string; mimeType: string },
  input: Omit<TransformEmojiInput, 'imageUrl'>
) {
  const original = await uploadFile(file.buffer, file.filename, file.mimeType);
  const provider = getAIProvider();

  const result = await transformEmoji({ ...input, imageUrl: original.url });
  const { buffer, mimeType } = dataUrlToBuffer(result.imageUrl);
  const ext = mimeType.split('/')[1] ?? 'png';
  const upload = await uploadFile(buffer, `emoji.${ext}`, mimeType);

  return prisma.emoji.create({
    data: {
      userId,
      name: input.prompt.slice(0, 80),
      slug: slugify(input.prompt),
      prompt: input.prompt,
      negativePrompt: input.negativePrompt,
      imageUrl: upload.url,
      thumbnailUrl: upload.url,
      originalImageUrl: original.url,
      mimeType,
      width: upload.width ?? result.width,
      height: upload.height ?? result.height,
      fileSize: upload.size,
      provider: provider.name,
      status: 'completed',
      sourceType: 'transformed',
      style: input.style,
      expression: input.expression,
      background: input.background ?? 'transparent',
      metadata: (result.metadata as Prisma.InputJsonValue) ?? undefined,
    },
  });
}

export async function createVariation(userId: string, parentId: string, overrides: Partial<GenerateEmojiInput>) {
  const parent = await assertOwnedEmoji(userId, parentId);
  if (!parent.prompt) throw new Error('Source emoji has no prompt to vary');

  const input: GenerateEmojiInput = {
    prompt: overrides.prompt ?? parent.prompt,
    negativePrompt: overrides.negativePrompt ?? parent.negativePrompt ?? undefined,
    style: overrides.style ?? parent.style ?? undefined,
    expression: overrides.expression ?? parent.expression ?? undefined,
    background: overrides.background ?? parent.background,
  };

  const emoji = await generateAndSaveEmoji(userId, input);
  return prisma.emoji.update({ where: { id: emoji.id }, data: { parentEmojiId: parent.id } });
}

export async function listEmojis(userId: string, query: EmojiQueryInput) {
  const where: Prisma.EmojiWhereInput = {
    userId,
    ...(query.favorite !== undefined ? { favorite: query.favorite } : {}),
    ...(query.sourceType ? { sourceType: query.sourceType } : {}),
    ...(query.style ? { style: query.style } : {}),
    ...(query.search ? { name: { contains: query.search, mode: 'insensitive' } } : {}),
    ...(query.collectionId ? { collections: { some: { collectionId: query.collectionId } } } : {}),
  };

  const orderBy: Prisma.EmojiOrderByWithRelationInput =
    query.sort === 'oldest'
      ? { createdAt: 'asc' }
      : query.sort === 'mostUsed'
        ? { usageCount: 'desc' }
        : query.sort === 'name'
          ? { name: 'asc' }
          : { createdAt: 'desc' };

  const [items, total] = await Promise.all([
    prisma.emoji.findMany({
      where,
      orderBy,
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    }),
    prisma.emoji.count({ where }),
  ]);

  return { items, total, page: query.page, limit: query.limit, totalPages: Math.ceil(total / query.limit) };
}

export async function getEmoji(userId: string, id: string) {
  return assertOwnedEmoji(userId, id);
}

export async function updateEmoji(userId: string, id: string, data: UpdateEmojiInput) {
  await assertOwnedEmoji(userId, id);
  return prisma.emoji.update({
    where: { id },
    data: { ...data, metadata: data.metadata as Prisma.InputJsonValue | undefined },
  });
}

export async function toggleFavorite(userId: string, id: string) {
  const emoji = await assertOwnedEmoji(userId, id);
  return prisma.emoji.update({ where: { id }, data: { favorite: !emoji.favorite } });
}

export async function deleteEmoji(userId: string, id: string) {
  const emoji = await assertOwnedEmoji(userId, id);
  const storage = getStorageProvider();
  const keys = [emoji.imageUrl, emoji.thumbnailUrl, emoji.originalImageUrl]
    .filter((url): url is string => !!url)
    .map((url) => url.split('/').pop()!)
    .filter(Boolean);

  await Promise.all(keys.map((key) => deleteFile(key).catch(() => undefined)));
  void storage;
  await prisma.emoji.delete({ where: { id } });
}

export async function recordUsage(userId: string, input: UsageEventInput) {
  await assertOwnedEmoji(userId, input.emojiId);
  await prisma.$transaction([
    prisma.emojiUsage.create({
      data: {
        userId,
        emojiId: input.emojiId,
        action: input.action,
        metadata: (input.metadata as Prisma.InputJsonValue) ?? undefined,
      },
    }),
    prisma.emoji.update({
      where: { id: input.emojiId },
      data: { usageCount: { increment: 1 } },
    }),
  ]);
}

export async function getDashboardStats(userId: string) {
  const [totalEmojis, favoriteCount, collectionCount, recent] = await Promise.all([
    prisma.emoji.count({ where: { userId } }),
    prisma.emoji.count({ where: { userId, favorite: true } }),
    prisma.collection.count({ where: { userId } }),
    prisma.emoji.findMany({ where: { userId }, orderBy: { createdAt: 'desc' }, take: 8 }),
  ]);

  return { totalEmojis, favoriteCount, collectionCount, recent };
}
