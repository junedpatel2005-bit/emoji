-- CreateEnum
CREATE TYPE "EmojiStatus" AS ENUM ('pending', 'processing', 'completed', 'failed');

-- CreateEnum
CREATE TYPE "EmojiSourceType" AS ENUM ('generated', 'uploaded', 'transformed');

-- CreateEnum
CREATE TYPE "EmojiStyle" AS ENUM ('emoji', 'emoji_3d', 'sticker', 'cartoon', 'pixel', 'minimal', 'clay', 'glossy');

-- CreateEnum
CREATE TYPE "EmojiExpression" AS ENUM ('happy', 'laughing', 'angry', 'sad', 'cool', 'surprised', 'neutral', 'custom');

-- CreateEnum
CREATE TYPE "EmojiBackground" AS ENUM ('transparent', 'solid', 'gradient');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "avatarUrl" TEXT,
    "passwordHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "emojis" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "prompt" TEXT,
    "negativePrompt" TEXT,
    "generationPrompt" TEXT,
    "imageUrl" TEXT NOT NULL,
    "thumbnailUrl" TEXT,
    "originalImageUrl" TEXT,
    "mimeType" TEXT NOT NULL DEFAULT 'image/png',
    "width" INTEGER NOT NULL,
    "height" INTEGER NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "provider" TEXT,
    "model" TEXT,
    "status" "EmojiStatus" NOT NULL DEFAULT 'completed',
    "sourceType" "EmojiSourceType" NOT NULL DEFAULT 'generated',
    "style" "EmojiStyle" DEFAULT 'emoji',
    "expression" "EmojiExpression" DEFAULT 'neutral',
    "background" "EmojiBackground" NOT NULL DEFAULT 'transparent',
    "favorite" BOOLEAN NOT NULL DEFAULT false,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "parentEmojiId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "emojis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "collections" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "collections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "collection_emojis" (
    "id" TEXT NOT NULL,
    "collectionId" TEXT NOT NULL,
    "emojiId" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "collection_emojis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "generation_jobs" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "emojiId" TEXT,
    "provider" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "input" JSONB,
    "output" JSONB,
    "status" "EmojiStatus" NOT NULL DEFAULT 'pending',
    "error" TEXT,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "generation_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "emoji_usages" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "emojiId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "emoji_usages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "emojis_userId_idx" ON "emojis"("userId");

-- CreateIndex
CREATE INDEX "emojis_userId_favorite_idx" ON "emojis"("userId", "favorite");

-- CreateIndex
CREATE INDEX "emojis_userId_sourceType_idx" ON "emojis"("userId", "sourceType");

-- CreateIndex
CREATE INDEX "emojis_parentEmojiId_idx" ON "emojis"("parentEmojiId");

-- CreateIndex
CREATE UNIQUE INDEX "emojis_userId_slug_key" ON "emojis"("userId", "slug");

-- CreateIndex
CREATE INDEX "collections_userId_idx" ON "collections"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "collections_userId_name_key" ON "collections"("userId", "name");

-- CreateIndex
CREATE INDEX "collection_emojis_collectionId_idx" ON "collection_emojis"("collectionId");

-- CreateIndex
CREATE INDEX "collection_emojis_emojiId_idx" ON "collection_emojis"("emojiId");

-- CreateIndex
CREATE UNIQUE INDEX "collection_emojis_collectionId_emojiId_key" ON "collection_emojis"("collectionId", "emojiId");

-- CreateIndex
CREATE INDEX "generation_jobs_userId_idx" ON "generation_jobs"("userId");

-- CreateIndex
CREATE INDEX "generation_jobs_emojiId_idx" ON "generation_jobs"("emojiId");

-- CreateIndex
CREATE INDEX "generation_jobs_status_idx" ON "generation_jobs"("status");

-- CreateIndex
CREATE INDEX "emoji_usages_userId_idx" ON "emoji_usages"("userId");

-- CreateIndex
CREATE INDEX "emoji_usages_emojiId_idx" ON "emoji_usages"("emojiId");

-- CreateIndex
CREATE INDEX "emoji_usages_action_idx" ON "emoji_usages"("action");

-- CreateIndex
CREATE INDEX "emoji_usages_createdAt_idx" ON "emoji_usages"("createdAt");

-- AddForeignKey
ALTER TABLE "emojis" ADD CONSTRAINT "emojis_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "emojis" ADD CONSTRAINT "emojis_parentEmojiId_fkey" FOREIGN KEY ("parentEmojiId") REFERENCES "emojis"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "collections" ADD CONSTRAINT "collections_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "collection_emojis" ADD CONSTRAINT "collection_emojis_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "collections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "collection_emojis" ADD CONSTRAINT "collection_emojis_emojiId_fkey" FOREIGN KEY ("emojiId") REFERENCES "emojis"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "generation_jobs" ADD CONSTRAINT "generation_jobs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "generation_jobs" ADD CONSTRAINT "generation_jobs_emojiId_fkey" FOREIGN KEY ("emojiId") REFERENCES "emojis"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "emoji_usages" ADD CONSTRAINT "emoji_usages_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "emoji_usages" ADD CONSTRAINT "emoji_usages_emojiId_fkey" FOREIGN KEY ("emojiId") REFERENCES "emojis"("id") ON DELETE CASCADE ON UPDATE CASCADE;
