export class ApiError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly status: number
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function apiFetch<T>(input: string, init?: RequestInit): Promise<T> {
  const res = await fetch(input, {
    ...init,
    credentials: 'same-origin',
    headers: init?.body instanceof FormData ? init.headers : { 'Content-Type': 'application/json', ...init?.headers },
  });

  const payload = await res.json().catch(() => null);

  if (!res.ok) {
    const message = payload?.error?.message ?? 'Request failed';
    const code = payload?.error?.code ?? 'UNKNOWN_ERROR';
    throw new ApiError(message, code, res.status);
  }

  return payload.data as T;
}
