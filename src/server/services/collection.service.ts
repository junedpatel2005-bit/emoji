import { prisma } from '@/lib/db/prisma';
import { NotFoundError, ForbiddenError } from '@/lib/api/response';
import type { CreateCollectionInput, UpdateCollectionInput } from '@/lib/validation/schemas';

async function assertOwnedCollection(userId: string, id: string) {
  const collection = await prisma.collection.findUnique({ where: { id } });
  if (!collection) throw new NotFoundError('Collection not found');
  if (collection.userId !== userId) throw new ForbiddenError('You do not own this collection');
  return collection;
}

export async function listCollections(userId: string) {
  return prisma.collection.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { emojis: true } } },
  });
}

export async function createCollection(userId: string, data: CreateCollectionInput) {
  return prisma.collection.create({ data: { ...data, userId } });
}

export async function getCollection(userId: string, id: string) {
  await assertOwnedCollection(userId, id);
  return prisma.collection.findUnique({
    where: { id },
    include: { emojis: { include: { emoji: true }, orderBy: { order: 'asc' } } },
  });
}

export async function updateCollection(userId: string, id: string, data: UpdateCollectionInput) {
  await assertOwnedCollection(userId, id);
  return prisma.collection.update({ where: { id }, data });
}

export async function deleteCollection(userId: string, id: string) {
  await assertOwnedCollection(userId, id);
  await prisma.collection.delete({ where: { id } });
}

export async function addEmojiToCollection(userId: string, collectionId: string, emojiId: string) {
  await assertOwnedCollection(userId, collectionId);
  const emoji = await prisma.emoji.findUnique({ where: { id: emojiId } });
  if (!emoji || emoji.userId !== userId) throw new ForbiddenError('You do not own this emoji');

  const count = await prisma.collectionEmoji.count({ where: { collectionId } });
  return prisma.collectionEmoji.upsert({
    where: { collectionId_emojiId: { collectionId, emojiId } },
    update: {},
    create: { collectionId, emojiId, order: count },
  });
}

export async function removeEmojiFromCollection(userId: string, collectionId: string, emojiId: string) {
  await assertOwnedCollection(userId, collectionId);
  await prisma.collectionEmoji.deleteMany({ where: { collectionId, emojiId } });
}
