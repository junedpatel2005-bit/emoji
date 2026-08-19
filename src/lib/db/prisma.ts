import { PrismaClient } from '@/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const connectionString = process.env.DATABASE_URL;

let prismaClient: PrismaClient | null = null;

if (connectionString) {
  const adapter = new PrismaPg({ connectionString });
  prismaClient = new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });
} else if (process.env.NODE_ENV === 'development') {
  // Development: create a mock Prisma client that throws helpful errors
  // This allows the UI to be reviewed without a database connection
  const createMockPrisma = () => {
    const throwDbError = () => {
      throw new Error(
        'Database connection not configured. Please set DATABASE_URL environment variable to connect to PostgreSQL. ' +
        'For local development, you can use a local PostgreSQL instance or a cloud provider like Neon, Supabase, or Railway.'
      );
    };

    const mockModel = {
      findUnique: throwDbError,
      findFirst: throwDbError,
      findMany: throwDbError,
      create: throwDbError,
      createMany: throwDbError,
      update: throwDbError,
      updateMany: throwDbError,
      upsert: throwDbError,
      delete: throwDbError,
      deleteMany: throwDbError,
      count: throwDbError,
      aggregate: throwDbError,
      groupBy: throwDbError,
    };

    return {
      user: mockModel,
      emoji: mockModel,
      collection: mockModel,
      collectionEmoji: mockModel,
      generationJob: mockModel,
      emojiUsage: mockModel,
      $connect: throwDbError,
      $disconnect: async () => {},
      $on: () => {},
      $transaction: throwDbError,
      $extends: () => createMockPrisma(),
    } as unknown as PrismaClient;
  };

  prismaClient = createMockPrisma();
} else {
  // Production without DATABASE_URL - this should not happen
  throw new Error('DATABASE_URL environment variable is required in production');
}

export const prisma = globalForPrisma.prisma ?? prismaClient!;

if (process.env.NODE_ENV !== 'production' && prismaClient) {
  globalForPrisma.prisma = prismaClient;
}

export default prisma;
