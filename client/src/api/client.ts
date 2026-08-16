import { ApiError, type ErrorResponse } from '../types/api';

export type ApiClientConfig = {
  baseUrl: string;
  getToken: () => string | null;
  onUnauthorized: () => void;
};

export type RequestOptions = {
  method?: string;
  body?: unknown;
  /** When false, do not attach the bearer token (e.g. sign-in). Default true. */
  auth?: boolean;
  signal?: AbortSignal;
};

/**
 * Shared JSON HTTP client for the API Server.
 * Attaches the session token, parses ErrorResponse, and signals invalid sessions.
 */
export class ApiClient {
  private readonly config: ApiClientConfig;

  constructor(config: ApiClientConfig) {
    this.config = config;
  }

  get<T>(path: string, options?: Omit<RequestOptions, 'method' | 'body'>): Promise<T> {
    return this.request<T>(path, { ...options, method: 'GET' });
  }

  post<T>(path: string, body?: unknown, options?: Omit<RequestOptions, 'method' | 'body'>): Promise<T> {
    return this.request<T>(path, { ...options, method: 'POST', body });
  }

  put<T>(path: string, body?: unknown, options?: Omit<RequestOptions, 'method' | 'body'>): Promise<T> {
    return this.request<T>(path, { ...options, method: 'PUT', body });
  }

  patch<T>(path: string, body?: unknown, options?: Omit<RequestOptions, 'method' | 'body'>): Promise<T> {
    return this.request<T>(path, { ...options, method: 'PATCH', body });
  }

  delete<T>(path: string, options?: Omit<RequestOptions, 'method' | 'body'>): Promise<T> {
    return this.request<T>(path, { ...options, method: 'DELETE' });
  }

  async request<T>(path: string, options: RequestOptions = {}): Promise<T> {
    const headers = new Headers({ Accept: 'application/json' });
    if (options.body !== undefined) {
      headers.set('Content-Type', 'application/json');
    }

    const auth = options.auth !== false;
    if (auth) {
      const token = this.config.getToken();
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
    }

    const response = await fetch(joinUrl(this.config.baseUrl, path), {
      method: options.method ?? 'GET',
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      signal: options.signal,
    });

    if (response.status === 204) {
      return undefined as T;
    }

    const payload = await readJson(response);

    if (!response.ok) {
      const errorBody = toErrorResponse(payload, response.statusText);
      if (response.status === 401) {
        this.config.onUnauthorized();
      }
      throw new ApiError(response.status, errorBody);
    }

    return payload as T;
  }
}

function joinUrl(baseUrl: string, path: string): string {
  if (!baseUrl) {
    return path.startsWith('/') ? path : `/${path}`;
  }
  return `${baseUrl.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
}

async function readJson(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) {
    return null;
  }
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return { message: text };
  }
}

function toErrorResponse(payload: unknown, fallback: string): ErrorResponse {
  if (payload && typeof payload === 'object' && 'message' in payload) {
    const body = payload as ErrorResponse;
    return {
      message: body.message || fallback,
      code: body.code,
      errors: body.errors,
    };
  }
  return { message: fallback || 'Request failed' };
}
