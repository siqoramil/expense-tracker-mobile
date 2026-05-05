import Constants from 'expo-constants';

const DEFAULT_API_URL = 'https://expensetracker.ovrin.uz';

const configuredApiUrl = (Constants.expoConfig?.extra as { apiUrl?: string } | undefined)?.apiUrl;
const BASE_URL = (configuredApiUrl ?? DEFAULT_API_URL).replace(/\/+$/, '');

let authToken: string | null = null;

export const setApiToken = (token: string | null) => {
  authToken = token;
};

export const getApiToken = () => authToken;

// Called by apiRequest when the server returns 401, so the store layer can
// drop the bad token and bounce the user to login. Wired in store.ts to
// avoid a circular import between api.ts and store.ts.
let onUnauthorized: (() => void) | null = null;
export const setUnauthorizedHandler = (fn: (() => void) | null) => {
  onUnauthorized = fn;
};

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: unknown;
  signal?: AbortSignal;
  // Set to skip the global 401 → logout side-effect (e.g. login attempts
  // where 401 is an expected outcome, not a session-expiry signal).
  skipAuthRefresh?: boolean;
};

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export const apiRequest = async <T>(path: string, opts: RequestOptions = {}): Promise<T> => {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (authToken) headers.Authorization = `Bearer ${authToken}`;
  const res = await fetch(`${BASE_URL}${path}`, {
    method: opts.method ?? 'GET',
    headers,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
    signal: opts.signal,
  });
  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try {
      const data = await res.json();
      if (data?.error) msg = String(data.error);
    } catch {}
    // 401 with a token in hand means the session was revoked or expired
    // (e.g. password reset bumped passwordChangedAt server-side). Drop it.
    if (res.status === 401 && authToken && !opts.skipAuthRefresh) {
      onUnauthorized?.();
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
  // New in server 1.1.0 — older servers may omit these. Treat missing as false.
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
  // Server 1.1.0 requires re-auth: password for password accounts, fresh
  // Google idToken for Google-only accounts. Both fields are server-validated.
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
    apiRequest<{ ok: true }>('/auth/password/verify-code', {
      method: 'POST',
      body,
      skipAuthRefresh: true,
    }),
  resetPassword: (body: { email: string; code: string; newPassword: string }) =>
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
  // Authenticated link flow: caller is already signed in with their
  // password account and is attaching a Google identity whose email
  // matches the account email. Replaces the auto-link that /auth/google
  // used to do (which enabled an account-takeover gap).
  linkGoogle: (body: { idToken: string }) =>
    apiRequest<{ user: UserDTO }>('/auth/google/link', { method: 'POST', body }),
};
