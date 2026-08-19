import { StorageProvider, StorageConfig, LocalStorageConfig } from './types';
import { LocalStorageProvider, createLocalStorageProvider } from './local';

let storageInstance: StorageProvider | null = null;

export function getStorageProvider(): StorageProvider {
  if (!storageInstance) {
    storageInstance = createStorageProvider();
  }
  return storageInstance;
}

export function setStorageProvider(provider: StorageProvider): void {
  storageInstance = provider;
}

function createStorageProvider(): StorageProvider {
  const providerType = (process.env.STORAGE_PROVIDER as StorageConfig['provider']) || 'local';
  
  switch (providerType) {
    case 'local':
      return createLocalStorageProvider();
    case 's3':
      throw new Error('S3 storage provider not yet implemented');
    case 'r2':
      throw new Error('R2 storage provider not yet implemented');
    case 'supabase':
      throw new Error('Supabase storage provider not yet implemented');
    case 'vercel-blob':
      throw new Error('Vercel Blob storage provider not yet implemented');
    default:
      console.warn(`[Storage] Unknown provider "${providerType}", falling back to local`);
      return createLocalStorageProvider();
  }
}

export async function uploadFile(
  buffer: Buffer,
  filename: string,
  mimeType: string,
  options?: { key?: string; metadata?: Record<string, string> }
) {
  const provider = getStorageProvider();
  return provider.upload({ buffer, filename, mimeType, ...options });
}

export async function deleteFile(key: string) {
  const provider = getStorageProvider();
  return provider.delete(key);
}

export function getPublicUrl(key: string): string {
  const provider = getStorageProvider();
  return provider.getPublicUrl(key);
}

export async function getSignedUrl(key: string, expiresIn?: number): Promise<string> {
  const provider = getStorageProvider();
  return provider.getSignedUrl(key, expiresIn);
}

export async function fileExists(key: string): Promise<boolean> {
  const provider = getStorageProvider();
  return provider.exists(key);
}

export async function getFileMetadata(key: string) {
  const provider = getStorageProvider();
  return provider.getMetadata(key);
}

export type { StorageProvider, StorageConfig, LocalStorageConfig };
export type { UploadFile, UploadResult, FileMetadata } from './types';
export { LocalStorageProvider, createLocalStorageProvider } from './local';
