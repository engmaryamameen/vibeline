import { env } from './env';

type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'DELETE';

export class ApiError extends Error {
  status: number;
  code?: string;

  constructor(status: number, message: string, code?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

export const apiClient = async <TResponse>(
  path: string,
  options?: {
    method?: HttpMethod;
    body?: unknown;
    token?: string;
  }
): Promise<TResponse> => {
  const response = await fetch(`${env.apiBaseUrl}${path}`, {
    method: options?.method ?? 'GET',
    headers: {
      'content-type': 'application/json',
      ...(options?.token ? { authorization: `Bearer ${options.token}` } : {})
    },
    body: options?.body ? JSON.stringify(options.body) : undefined,
    credentials: 'include',
    cache: 'no-store'
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({ message: 'Request failed' }));
    throw new ApiError(response.status, payload.message ?? 'Request failed', payload.code);
  }

  if (response.status === 204) {
    return undefined as TResponse;
  }

  return response.json() as Promise<TResponse>;
};
