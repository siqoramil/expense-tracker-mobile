import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  ApiError,
  apiRequest,
  authApi,
  getApiToken,
  setApiToken,
  setUnauthorizedHandler,
} from '../lib/api';

type FetchMock = ReturnType<typeof vi.fn> & typeof fetch;

const mockFetch = (body: unknown, init: { status?: number; ok?: boolean } = {}): FetchMock => {
  const status = init.status ?? 200;
  const ok = init.ok ?? (status >= 200 && status < 300);
  const fn = vi.fn(async () => ({
    ok,
    status,
    json: async () => body,
  })) as unknown as FetchMock;
  global.fetch = fn;
  return fn;
};

describe('apiRequest', () => {
  beforeEach(() => {
    setApiToken(null);
    setUnauthorizedHandler(null);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('attaches Authorization header when a token is set', async () => {
    setApiToken('token-abc');
    const fetchMock = mockFetch({ user: { id: '1' } });
    await apiRequest('/auth/me');
    const [, init] = fetchMock.mock.calls[0]!;
    const headers = (init as RequestInit).headers as Record<string, string>;
    expect(headers.Authorization).toBe('Bearer token-abc');
    expect(headers['Content-Type']).toBe('application/json');
  });

  it('omits Authorization when no token is set', async () => {
    const fetchMock = mockFetch({ ok: true });
    await apiRequest('/auth/login', { method: 'POST', body: { email: 'a@b.c', password: 'x' } });
    const [, init] = fetchMock.mock.calls[0]!;
    const headers = (init as RequestInit).headers as Record<string, string>;
    expect(headers.Authorization).toBeUndefined();
  });

  it('throws ApiError with the snake_case error code from the body', async () => {
    mockFetch({ error: 'invalid_credentials' }, { status: 401, ok: false });
    await expect(apiRequest('/auth/login', { method: 'POST', body: {} })).rejects.toMatchObject({
      message: 'invalid_credentials',
      status: 401,
    });
  });

  it('throws ApiError with HTTP <status> when the body has no error field', async () => {
    mockFetch({}, { status: 500, ok: false });
    await expect(apiRequest('/health')).rejects.toMatchObject({
      message: 'HTTP 500',
      status: 500,
    });
  });

  it('returns undefined for 204 No Content', async () => {
    mockFetch(null, { status: 204, ok: true });
    const result = await apiRequest('/auth/account/confirm-delete', { method: 'POST' });
    expect(result).toBeUndefined();
  });

  it('invokes the unauthorized handler on 401 when a token is set', async () => {
    setApiToken('stale-token');
    const onUnauthorized = vi.fn();
    setUnauthorizedHandler(onUnauthorized);
    mockFetch({ error: 'token_revoked' }, { status: 401, ok: false });
    await expect(apiRequest('/auth/me')).rejects.toBeInstanceOf(ApiError);
    expect(onUnauthorized).toHaveBeenCalledTimes(1);
  });

  it('does NOT invoke the unauthorized handler on 401 when no token is set', async () => {
    // 401 on a public route shouldn't trigger logout — there's no session
    // to invalidate in the first place. Login attempts also live here.
    const onUnauthorized = vi.fn();
    setUnauthorizedHandler(onUnauthorized);
    mockFetch({ error: 'invalid_credentials' }, { status: 401, ok: false });
    await expect(apiRequest('/auth/login', { method: 'POST' })).rejects.toBeInstanceOf(ApiError);
    expect(onUnauthorized).not.toHaveBeenCalled();
  });

  it('does NOT invoke the unauthorized handler when skipAuthRefresh is set', async () => {
    setApiToken('token-xyz');
    const onUnauthorized = vi.fn();
    setUnauthorizedHandler(onUnauthorized);
    mockFetch({ error: 'invalid_credentials' }, { status: 401, ok: false });
    await expect(
      apiRequest('/auth/login', { method: 'POST', body: {}, skipAuthRefresh: true }),
    ).rejects.toBeInstanceOf(ApiError);
    expect(onUnauthorized).not.toHaveBeenCalled();
  });

  it('does NOT invoke the unauthorized handler on non-401 errors', async () => {
    setApiToken('token-xyz');
    const onUnauthorized = vi.fn();
    setUnauthorizedHandler(onUnauthorized);
    mockFetch({ error: 'not_found' }, { status: 404, ok: false });
    await expect(apiRequest('/auth/me')).rejects.toBeInstanceOf(ApiError);
    expect(onUnauthorized).not.toHaveBeenCalled();
  });

  it('serializes the body as JSON for write methods', async () => {
    setApiToken('token-xyz');
    const fetchMock = mockFetch({ user: { id: '1' } });
    await apiRequest('/auth/me', {
      method: 'PATCH',
      body: { name: 'Alice', avatar: 'AL' },
    });
    const [, init] = fetchMock.mock.calls[0]!;
    expect((init as RequestInit).method).toBe('PATCH');
    expect((init as RequestInit).body).toBe(JSON.stringify({ name: 'Alice', avatar: 'AL' }));
  });

  it('reads the BASE_URL from the expo-constants stub', async () => {
    const fetchMock = mockFetch({ ok: true });
    await apiRequest('/health');
    const [url] = fetchMock.mock.calls[0]!;
    expect(url).toBe('https://test.example.com/health');
  });
});

describe('setApiToken / getApiToken', () => {
  it('round-trips the token', () => {
    setApiToken('abc123');
    expect(getApiToken()).toBe('abc123');
    setApiToken(null);
    expect(getApiToken()).toBeNull();
  });
});

describe('authApi.confirmAccountDelete', () => {
  beforeEach(() => {
    setApiToken('valid-jwt');
    setUnauthorizedHandler(null);
  });

  it('forwards password to the server for password accounts', async () => {
    const fetchMock = mockFetch(null, { status: 204, ok: true });
    await authApi.confirmAccountDelete({ code: '123456', password: 'hunter22' });
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toBe('https://test.example.com/auth/account/confirm-delete');
    expect((init as RequestInit).method).toBe('POST');
    expect(JSON.parse((init as RequestInit).body as string)).toEqual({
      code: '123456',
      password: 'hunter22',
    });
  });

  it('forwards idToken to the server for Google-only accounts', async () => {
    const fetchMock = mockFetch(null, { status: 204, ok: true });
    await authApi.confirmAccountDelete({ code: '123456', idToken: 'google-id-token' });
    const [, init] = fetchMock.mock.calls[0]!;
    expect(JSON.parse((init as RequestInit).body as string)).toEqual({
      code: '123456',
      idToken: 'google-id-token',
    });
  });

  it('does NOT auto-logout on 400 password_required', async () => {
    // A 400 from confirm-delete means "wrong reauth payload", not an
    // expired session — the user should stay logged in to retry.
    const onUnauthorized = vi.fn();
    setUnauthorizedHandler(onUnauthorized);
    mockFetch({ error: 'password_required' }, { status: 400, ok: false });
    await expect(authApi.confirmAccountDelete({ code: '123456' })).rejects.toMatchObject({
      message: 'password_required',
      status: 400,
    });
    expect(onUnauthorized).not.toHaveBeenCalled();
  });
});

describe('authApi.linkGoogle', () => {
  beforeEach(() => {
    setApiToken('valid-jwt');
    setUnauthorizedHandler(null);
  });

  it('POSTs to /auth/google/link with the idToken', async () => {
    const fetchMock = mockFetch({ user: { id: 'u1', email: 'a@b.c' } });
    await authApi.linkGoogle({ idToken: 'gid' });
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toBe('https://test.example.com/auth/google/link');
    expect((init as RequestInit).method).toBe('POST');
    expect(JSON.parse((init as RequestInit).body as string)).toEqual({ idToken: 'gid' });
  });

  it('surfaces 409 google_account_in_use as ApiError', async () => {
    mockFetch({ error: 'google_account_in_use' }, { status: 409, ok: false });
    await expect(authApi.linkGoogle({ idToken: 'gid' })).rejects.toMatchObject({
      message: 'google_account_in_use',
      status: 409,
    });
  });
});

describe('authApi.google', () => {
  beforeEach(() => {
    setApiToken(null);
    setUnauthorizedHandler(null);
  });

  it('surfaces 409 account_link_required without auto-logout', async () => {
    // Sign-in routes set skipAuthRefresh — even a 401 here shouldn't
    // call the unauthorized handler. 409 also musn't fire it.
    const onUnauthorized = vi.fn();
    setUnauthorizedHandler(onUnauthorized);
    mockFetch({ error: 'account_link_required' }, { status: 409, ok: false });
    await expect(authApi.google({ idToken: 'gid' })).rejects.toMatchObject({
      message: 'account_link_required',
      status: 409,
    });
    expect(onUnauthorized).not.toHaveBeenCalled();
  });
});
