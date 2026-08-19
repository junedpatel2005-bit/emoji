import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}));

// Mock environment variables
process.env.NVIDIA_API_KEY = 'test-key';
process.env.NVIDIA_BASE_URL = 'https://api.nvidia.com/v1';
process.env.NVIDIA_MODEL = 'test-model';
process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000';
process.env.STORAGE_PROVIDER = 'local';
process.env.MAX_UPLOAD_SIZE_MB = '10';