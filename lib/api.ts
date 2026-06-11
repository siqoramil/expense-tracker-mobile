import Constants from 'expo-constants';

const DEFAULT_API_URL = 'https://expensetracker.ovrin.uz';
const REQUEST_TIMEOUT_MS = 12_000;

const configuredApiUrl = (Constants.expoConfig?.extra as { apiUrl?: string } | undefined)?.apiUrl;
const BASE_URL = (configuredApiUrl ?? DEFAULT_API_URL).replace(/\/+$/, '');

let authToken: string | null = null;

export const setApiToken = (token: string | null) => {
  authToken = token;
  if (token !== null) unauthorizedFired = false;
};

export const getApiToken = () => authToken;

let onUnauthorized: (() => void) | null = null;
let unauthorizedFired = false;
export const setUnauthorizedHandler = (fn: (() => void) | null) => {
  onUnauthorized = fn;
};

type ServerStatus = 'ok' | 'unreachable';
type ServerStatusListener = (status: ServerStatus) => void;
const serverStatusListeners = new Set<ServerStatusListener>();
let currentServerStatus: ServerStatus = 'ok';
let consecutiveNetworkFailures = 0;
const UNREACHABLE_THRESHOLD = 2;

export const getServerStatus = (): ServerStatus => currentServerStatus;

export const subscribeServerStatus = (fn: ServerStatusListener): (() => void) => {
  serverStatusListeners.add(fn);
  return () => {
    serverStatusListeners.delete(fn);
  };
};

const setServerStatus = (status: ServerStatus) => {
  if (currentServerStatus === status) return;
  currentServerStatus = status;
  serverStatusListeners.forEach((fn) => fn(status));
};

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: unknown;
  signal?: AbortSignal;
  skipAuthRefresh?: boolean;
  timeoutMs?: number;
};

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export class NetworkError extends Error {
  constructor(message = 'network_error') {
    super(message);
    this.name = 'NetworkError';
  }
}

export class TimeoutError extends Error {
  constructor(message = 'request_timeout') {
    super(message);
    this.name = 'TimeoutError';
  }
}

export const apiRequest = async <T>(path: string, opts: RequestOptions = {}): Promise<T> => {
  const headers: Record<string, string> = {};
  // Fastify v5 rejects requests that advertise Content-Type: application/json
  // but carry an empty body (FST_ERR_CTP_EMPTY_JSON_BODY -> 400). Only set it
  // when we actually have something to send.
  if (opts.body !== undefined) headers['Content-Type'] = 'application/json';
  if (authToken) headers.Authorization = `Bearer ${authToken}`;

  const controller = new AbortController();
  const timeoutMs = opts.timeoutMs ?? REQUEST_TIMEOUT_MS;
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  if (opts.signal) {
    if (opts.signal.aborted) controller.abort();
    else opts.signal.addEventListener('abort', () => controller.abort(), { once: true });
  }

  let res: Response;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      method: opts.method ?? 'GET',
      headers,
      body: opts.body ? JSON.stringify(opts.body) : undefined,
      signal: controller.signal,
    });
  } catch {
    clearTimeout(timeoutId);
    if (controller.signal.aborted && !opts.signal?.aborted) {
      consecutiveNetworkFailures += 1;
      if (consecutiveNetworkFailures >= UNREACHABLE_THRESHOLD) {
        setServerStatus('unreachable');
      }
      throw new TimeoutError();
    }
    // fetch rejects with TypeError on DNS/network failure. Use a consecutive
    // failure counter so a single transient failure does not show the overlay.
    consecutiveNetworkFailures += 1;
    if (consecutiveNetworkFailures >= UNREACHABLE_THRESHOLD) {
      setServerStatus('unreachable');
    }
    throw new NetworkError();
  }
  clearTimeout(timeoutId);

  // 5xx (excluding 501 which is "not implemented" by a working server) means
  // the server is reachable but failing. Treat 502/504 as unreachable so
  // the global overlay surfaces — proxies emit these when upstream is dead.
  // For 503, parse the body first: a known application-level error code means
  // the server is up and intentionally returning 503 (e.g. google_auth_disabled).
  if (res.status === 502 || res.status === 504) {
    consecutiveNetworkFailures += 1;
    if (consecutiveNetworkFailures >= UNREACHABLE_THRESHOLD) {
      setServerStatus('unreachable');
    }
  } else if (res.status === 503) {
    let bodyError: string | undefined;
    try {
      const data = await res.clone().json() as { error?: string };
      bodyError = data?.error;
    } catch {}
    const isAppLevel503 = typeof bodyError === 'string' && bodyError.length > 0;
    if (!isAppLevel503) {
      consecutiveNetworkFailures += 1;
      if (consecutiveNetworkFailures >= UNREACHABLE_THRESHOLD) {
        setServerStatus('unreachable');
      }
    }
  } else {
    consecutiveNetworkFailures = 0;
    setServerStatus('ok');
  }

  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try {
      const data = await res.json() as { error?: string };
      if (data?.error) msg = String(data.error);
    } catch {}
    if (res.status === 401 && authToken && !opts.skipAuthRefresh) {
      if (!unauthorizedFired) {
        unauthorizedFired = true;
        onUnauthorized?.();
      }
    }
    throw new ApiError(msg, res.status);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
};

export type UserDTO = {
  id: string;
  email: string;
  name: string;
  avatar: string;
  pro: boolean;
  prefs: Record<string, unknown>;
  hasPassword?: boolean;
  hasGoogle?: boolean;
};

export const authApi = {
  register: (body: { email: string; password: string; name: string }) =>
    apiRequest<{ token: string; user: UserDTO }>('/auth/register', {
      method: 'POST',
      body,
      skipAuthRefresh: true,
    }),
  login: (body: { email: string; password: string }) =>
    apiRequest<{ token: string; user: UserDTO }>('/auth/login', {
      method: 'POST',
      body,
      skipAuthRefresh: true,
    }),
  me: () => apiRequest<{ user: UserDTO }>('/auth/me'),
  updateMe: (body: { name?: string; avatar?: string; prefs?: Record<string, unknown> }) =>
    apiRequest<{ user: UserDTO }>('/auth/me', { method: 'PATCH', body }),
  requestAccountDelete: () =>
    apiRequest<{ sent: true; expiresInSeconds: number }>('/auth/account/request-delete', {
      method: 'POST',
    }),
  confirmAccountDelete: (body: { code: string; password?: string; idToken?: string }) =>
    apiRequest<void>('/auth/account/confirm-delete', { method: 'POST', body }),
  requestEmailChange: (body: { newEmail: string }) =>
    apiRequest<{ sent: true; expiresInSeconds: number }>('/auth/email/request-change', {
      method: 'POST',
      body,
    }),
  verifyEmailChange: (body: { code: string }) =>
    apiRequest<{ user: UserDTO }>('/auth/email/verify-change', { method: 'POST', body }),
  forgotPassword: (body: { email: string }) =>
    apiRequest<{ sent: true; expiresInSeconds: number }>('/auth/password/forgot', {
      method: 'POST',
      body,
      skipAuthRefresh: true,
    }),
  verifyResetCode: (body: { email: string; code: string }) =>
    apiRequest<{ ok: true; verifiedToken: string }>('/auth/password/verify-code', {
      method: 'POST',
      body,
      skipAuthRefresh: true,
    }),
  resetPassword: (body: { email: string; code: string; newPassword: string; verifiedToken: string }) =>
    apiRequest<{ token: string; user: UserDTO }>('/auth/password/reset', {
      method: 'POST',
      body,
      skipAuthRefresh: true,
    }),
  google: (body: { idToken: string }) =>
    apiRequest<{ token: string; user: UserDTO }>('/auth/google', {
      method: 'POST',
      body,
      skipAuthRefresh: true,
    }),
  linkGoogle: (body: { idToken: string }) =>
    apiRequest<{ user: UserDTO }>('/auth/google/link', { method: 'POST', body, skipAuthRefresh: true }),
  // Lightweight reachability check used by the ServerUnreachable retry button.
  ping: () => apiRequest<unknown>('/auth/me', { timeoutMs: 6_000 }),
};
