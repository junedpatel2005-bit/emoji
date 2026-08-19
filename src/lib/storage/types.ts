export interface StorageProvider {
  upload(file: UploadFile): Promise<UploadResult>;
  delete(key: string): Promise<void>;
  getPublicUrl(key: string): string;
  getSignedUrl(key: string, expiresIn?: number): Promise<string>;
  exists(key: string): Promise<boolean>;
  getMetadata(key: string): Promise<FileMetadata | null>;
}

export interface UploadFile {
  buffer: Buffer;
  filename: string;
  mimeType: string;
  key?: string;
  metadata?: Record<string, string>;
}

export interface UploadResult {
  key: string;
  url: string;
  size: number;
  mimeType: string;
  width?: number;
  height?: number;
}

export interface FileMetadata {
  key: string;
  size: number;
  mimeType: string;
  width?: number;
  height?: number;
  lastModified: Date;
  metadata?: Record<string, string>;
}

export interface StorageConfig {
  provider: 'local' | 's3' | 'r2' | 'supabase' | 'vercel-blob';
  local?: LocalStorageConfig;
  s3?: S3StorageConfig;
  r2?: R2StorageConfig;
  supabase?: SupabaseStorageConfig;
  vercelBlob?: VercelBlobStorageConfig;
}

export interface LocalStorageConfig {
  basePath: string;
  publicPath: string;
}

export interface S3StorageConfig {
  bucket: string;
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  endpoint?: string;
  publicUrl?: string;
}

export interface R2StorageConfig {
  bucket: string;
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  publicUrl?: string;
}

export interface SupabaseStorageConfig {
  url: string;
  serviceKey: string;
  bucket: string;
}

export interface VercelBlobStorageConfig {
  token: string;
}