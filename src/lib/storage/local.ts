import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import sharp from 'sharp';
import {
  StorageProvider,
  UploadFile,
  UploadResult,
  FileMetadata,
  LocalStorageConfig,
} from './types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class LocalStorageProvider implements StorageProvider {
  private basePath: string;
  private publicPath: string;

  constructor(config: LocalStorageConfig) {
    this.basePath = path.resolve(config.basePath);
    this.publicPath = config.publicPath;
    this.ensureDirectoryExists();
  }

  private async ensureDirectoryExists(): Promise<void> {
    try {
      await fs.mkdir(this.basePath, { recursive: true });
    } catch (error) {
      console.error('[Storage] Failed to create base directory:', error);
    }
  }

  private generateKey(filename: string): string {
    const ext = path.extname(filename);
    const hash = crypto.randomBytes(16).toString('hex');
    const timestamp = Date.now();
    return `${timestamp}-${hash}${ext}`;
  }

  async upload(file: UploadFile): Promise<UploadResult> {
    const key = file.key || this.generateKey(file.filename);
    const filePath = path.join(this.basePath, key);

    await fs.writeFile(filePath, file.buffer);

    let width: number | undefined;
    let height: number | undefined;

    if (file.mimeType.startsWith('image/')) {
      try {
        const metadata = await sharp(file.buffer).metadata();
        width = metadata.width;
        height = metadata.height;
      } catch {
        // Ignore metadata extraction errors
      }
    }

    const url = this.getPublicUrl(key);

    return {
      key,
      url,
      size: file.buffer.length,
      mimeType: file.mimeType,
      width,
      height,
    };
  }

  async delete(key: string): Promise<void> {
    const filePath = path.join(this.basePath, key);
    try {
      await fs.unlink(filePath);
    } catch (error) {
      // File might not exist, that's okay
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        throw error;
      }
    }
  }

  getPublicUrl(key: string): string {
    return `${this.publicPath}/${key}`;
  }

  async getSignedUrl(key: string, expiresIn = 3600): Promise<string> {
    // For local storage, signed URLs are the same as public URLs
    // In production with S3/R2, this would generate a presigned URL
    return this.getPublicUrl(key);
  }

  async exists(key: string): Promise<boolean> {
    const filePath = path.join(this.basePath, key);
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  async getMetadata(key: string): Promise<FileMetadata | null> {
    const filePath = path.join(this.basePath, key);
    try {
      const stats = await fs.stat(filePath);
      let width: number | undefined;
      let height: number | undefined;
      let mimeType = 'application/octet-stream';

      const ext = path.extname(key).toLowerCase();
      const mimeTypes: Record<string, string> = {
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.webp': 'image/webp',
        '.svg': 'image/svg+xml',
        '.gif': 'image/gif',
      };
      mimeType = mimeTypes[ext] || mimeType;

      if (mimeType.startsWith('image/')) {
        try {
          const metadata = await sharp(filePath).metadata();
          width = metadata.width;
          height = metadata.height;
        } catch {
          // Ignore
        }
      }

      return {
        key,
        size: stats.size,
        mimeType,
        width,
        height,
        lastModified: stats.mtime,
      };
    } catch {
      return null;
    }
  }
}

export function createLocalStorageProvider(config?: Partial<LocalStorageConfig>): LocalStorageProvider {
  const basePath = config?.basePath || process.env.LOCAL_STORAGE_PATH || './public/uploads';
  const publicPath = config?.publicPath || '/uploads';
  return new LocalStorageProvider({ basePath, publicPath });
}