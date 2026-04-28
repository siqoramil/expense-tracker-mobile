import Constants from 'expo-constants';

const API_PORT = 3000;

const resolveBaseUrl = (): string => {
  const configured = (Constants.expoConfig?.extra as { apiUrl?: string } | undefined)?.apiUrl;
  // In dev, derive the LAN IP from Expo's host so physical devices and
  // Android emulators can reach the backend without manual config.
  const debuggerHost =
    Constants.expoConfig?.hostUri ??
    (Constants as unknown as { expoGoConfig?: { debuggerHost?: string } }).expoGoConfig
      ?.debuggerHost;
  const host = debuggerHost?.split(':')[0];
  if (host && host !== 'localhost' && host !== '127.0.0.1') {
    return `http://${host}:${API_PORT}`;
  }
  return configured ?? `http://localhost:${API_PORT}`;
};

const BASE_URL = resolveBaseUrl();

let authToken: string | null = null;

export const setApiToken = (token: string | null) => {
  authToken = token;
};

export const getApiToken = () => authToken;

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: unknown;
  signal?: AbortSignal;
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
};

export const authApi = {
  register: (body: { email: string; password: string; name: string }) =>
    apiRequest<{ token: string; user: UserDTO }>('/auth/register', { method: 'POST', body }),
  login: (body: { email: string; password: string }) =>
    apiRequest<{ token: string; user: UserDTO }>('/auth/login', { method: 'POST', body }),
  me: () => apiRequest<{ user: UserDTO }>('/auth/me'),
  updateMe: (body: { name?: string; avatar?: string; prefs?: Record<string, unknown> }) =>
    apiRequest<{ user: UserDTO }>('/auth/me', { method: 'PATCH', body }),
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
    }),
  verifyResetCode: (body: { email: string; code: string }) =>
    apiRequest<{ ok: true }>('/auth/password/verify-code', { method: 'POST', body }),
  resetPassword: (body: { email: string; code: string; newPassword: string }) =>
    apiRequest<{ token: string; user: UserDTO }>('/auth/password/reset', {
      method: 'POST',
      body,
    }),
};
