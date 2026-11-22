const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

// Module-level token store. auth-context.tsx reads/writes this via the
// exported helpers so the fetch wrapper can attach + refresh it without a
// circular import on the React context.
let accessToken: string | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
}

export function getAccessToken() {
  return accessToken;
}

export class ApiError extends Error {
  status: number;
  body: unknown;
  constructor(status: number, message: string, body?: unknown) {
    super(message);
    this.status = status;
    this.body = body;
  }
}

let refreshPromise: Promise<boolean> | null = null;

async function doRefresh(): Promise<boolean> {
  if (!refreshPromise) {
    refreshPromise = fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
    })
      .then(async (res) => {
        if (!res.ok) return false;
        const data = await res.json();
        if (data?.accessToken) {
          setAccessToken(data.accessToken);
          return true;
        }
        return false;
      })
      .catch(() => false)
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

interface RequestOptions {
  body?: unknown;
  query?: Record<string, string | number | boolean | string[] | undefined>;
}

function buildUrl(path: string, query?: RequestOptions['query']) {
  const url = new URL(`${API_URL}${path}`);
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value === undefined || value === null || value === '') continue;
      if (Array.isArray(value)) {
        value.forEach((v) => url.searchParams.append(key, String(v)));
      } else {
        url.searchParams.set(key, String(value));
      }
    }
  }
  return url.toString();
}

async function request<T>(
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE' | 'PUT',
  path: string,
  options: RequestOptions = {},
  isRetry = false
): Promise<T> {
  const headers: Record<string, string> = {};
  if (options.body !== undefined) headers['Content-Type'] = 'application/json';
  if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`;

  const res = await fetch(buildUrl(path, options.query), {
    method,
    headers,
    credentials: 'include',
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

  if (res.status === 401 && !isRetry) {
    const refreshed = await doRefresh();
    if (refreshed) {
      return request<T>(method, path, options, true);
    }
  }

  if (!res.ok) {
    let body: unknown = undefined;
    try {
      body = await res.json();
    } catch {
      // no json body
    }
    const message =
      (body as { message?: string } | undefined)?.message || res.statusText || 'Request failed';
    throw new ApiError(res.status, message, body);
  }

  if (res.status === 204) return undefined as T;
  const text = await res.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

export const apiGet = <T>(path: string, query?: RequestOptions['query']) =>
  request<T>('GET', path, { query });

export const apiPost = <T>(path: string, body?: unknown) => request<T>('POST', path, { body });

export const apiPatch = <T>(path: string, body?: unknown) => request<T>('PATCH', path, { body });

export const apiPut = <T>(path: string, body?: unknown) => request<T>('PUT', path, { body });

export const apiDelete = <T>(path: string) => request<T>('DELETE', path);
