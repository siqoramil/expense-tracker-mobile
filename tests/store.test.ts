import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as api from '../lib/api';
import * as store from '../lib/store';

// All tests share the same module instances (no vi.resetModules) so the
// AsyncStorage mock + api singletons stay aligned. State is reset per-test
// via `resetSharedState`. This is fine because the store actions we test
// don't carry inter-test side-effects beyond what reset covers.

const SAMPLE_USER = {
  id: 'u1',
  email: 'alice@example.com',
  name: 'Alice',
  avatar: 'AL',
  pro: false,
  prefs: {},
  hasPassword: true,
  hasGoogle: false,
};

const mockFetch = (body: unknown, init: { status?: number; ok?: boolean } = {}) => {
  const status = init.status ?? 200;
  const ok = init.ok ?? (status >= 200 && status < 300);
  const fn = vi.fn(async () => ({
    ok,
    status,
    json: async () => body,
  })) as unknown as typeof fetch;
  global.fetch = fn;
  return fn as ReturnType<typeof vi.fn>;
};

beforeEach(() => {
  api.setApiToken(null);
  api.setUnauthorizedHandler(null);
  // Push the user-facing parts of state back to a known baseline. We
  // can't rebuild SEED from outside, but the fields we assert on are all
  // covered here.
  store.store.set((s) => ({
    ...s,
    loggedIn: false,
    token: null,
    profile: {
      ...s.profile,
      name: 'Sardor Akmalov',
      hasPassword: true,
      hasGoogle: false,
    },
  }));
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('applyUserDTO via verifyEmailChange', () => {
  it('reflects hasPassword/hasGoogle from a v1.1.0 server response', async () => {
    api.setApiToken('jwt');
    mockFetch({ user: { ...SAMPLE_USER, hasPassword: true, hasGoogle: true } });

    await store.actions.verifyEmailChange('123456');

    const profile = store.store.get().profile;
    expect(profile.hasPassword).toBe(true);
    expect(profile.hasGoogle).toBe(true);
  });

  it('defaults hasPassword/hasGoogle to false when an older server omits them', async () => {
    api.setApiToken('jwt');
    const legacyUser = { ...SAMPLE_USER };
    delete (legacyUser as Partial<typeof SAMPLE_USER>).hasPassword;
    delete (legacyUser as Partial<typeof SAMPLE_USER>).hasGoogle;
    mockFetch({ user: legacyUser });

    await store.actions.verifyEmailChange('123456');

    const profile = store.store.get().profile;
    expect(profile.hasPassword).toBe(false);
    expect(profile.hasGoogle).toBe(false);
  });

  it('falls back to initials when the server returns an empty avatar', async () => {
    api.setApiToken('jwt');
    mockFetch({ user: { ...SAMPLE_USER, avatar: '', name: 'Sardor Akmalov' } });

    await store.actions.verifyEmailChange('123456');

    expect(store.store.get().profile.avatar).toBe('SA');
  });
});

describe('actions.confirmAccountDelete', () => {
  it('forwards { code, password } to the API and resets the token', async () => {
    api.setApiToken('jwt');
    store.store.set((s) => ({ ...s, loggedIn: true, token: 'jwt' }));

    const fetchMock = mockFetch(null, { status: 204, ok: true });
    await store.actions.confirmAccountDelete('123456', { password: 'hunter22' });

    const [, init] = fetchMock.mock.calls[0]!;
    expect(JSON.parse((init as RequestInit).body as string)).toEqual({
      code: '123456',
      password: 'hunter22',
    });
    expect(api.getApiToken()).toBeNull();
    expect(store.store.get().loggedIn).toBe(false);
    expect(store.store.get().token).toBeNull();
  });

  it('forwards { code, idToken } for Google-only accounts', async () => {
    api.setApiToken('jwt');
    const fetchMock = mockFetch(null, { status: 204, ok: true });

    await store.actions.confirmAccountDelete('654321', { idToken: 'g-id-token' });

    const [, init] = fetchMock.mock.calls[0]!;
    expect(JSON.parse((init as RequestInit).body as string)).toEqual({
      code: '654321',
      idToken: 'g-id-token',
    });
  });

  it('propagates server errors instead of silently succeeding', async () => {
    api.setApiToken('jwt');
    mockFetch({ error: 'invalid_credentials' }, { status: 401, ok: false });

    await expect(
      store.actions.confirmAccountDelete('123456', { password: 'wrong' }),
    ).rejects.toMatchObject({ message: 'invalid_credentials' });
  });
});

describe('actions.linkGoogle', () => {
  it('POSTs to /auth/google/link and applies the returned user', async () => {
    api.setApiToken('jwt');
    const fetchMock = mockFetch({
      user: { ...SAMPLE_USER, hasGoogle: true },
    });

    await store.actions.linkGoogle('google-id-token');

    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toBe('https://test.example.com/auth/google/link');
    expect((init as RequestInit).method).toBe('POST');
    expect(JSON.parse((init as RequestInit).body as string)).toEqual({
      idToken: 'google-id-token',
    });
    expect(store.store.get().profile.hasGoogle).toBe(true);
  });

  it('surfaces email_mismatch errors without clobbering profile state', async () => {
    api.setApiToken('jwt');
    store.store.set((s) => ({
      ...s,
      profile: { ...s.profile, name: 'Original', hasGoogle: false },
    }));
    mockFetch({ error: 'email_mismatch' }, { status: 409, ok: false });

    await expect(store.actions.linkGoogle('mismatched-token')).rejects.toMatchObject({
      message: 'email_mismatch',
      status: 409,
    });

    expect(store.store.get().profile.name).toBe('Original');
    expect(store.store.get().profile.hasGoogle).toBe(false);
  });
});

describe('unauthorized handler integration', () => {
  it('clears the local session when an authenticated request returns 401', async () => {
    // Hand-wire the same handler hydrate() installs at app boot. This
    // exercises the public contract (api.ts → handler → store.ts) end
    // to end without depending on hydrate's once-per-process guard.
    api.setApiToken('stale-jwt');
    store.store.set((s) => ({ ...s, loggedIn: true, token: 'stale-jwt' }));
    api.setUnauthorizedHandler(() => {
      api.setApiToken(null);
      store.store.set((s) => ({ ...s, loggedIn: false, token: null }));
    });

    mockFetch({ error: 'token_revoked' }, { status: 401, ok: false });

    await expect(store.actions.verifyEmailChange('123456')).rejects.toBeInstanceOf(api.ApiError);

    expect(api.getApiToken()).toBeNull();
    expect(store.store.get().loggedIn).toBe(false);
    expect(store.store.get().token).toBeNull();
  });

  it('does NOT auto-logout when login fails (skipAuthRefresh path)', async () => {
    // Login is the only credential-checking call where 401 is expected.
    // The skipAuthRefresh flag in api.ts is what protects the user from
    // being kicked out mid-typo. Validate that contract here.
    let handlerCalled = 0;
    api.setUnauthorizedHandler(() => {
      handlerCalled += 1;
    });
    mockFetch({ error: 'invalid_credentials' }, { status: 401, ok: false });

    await expect(
      api.authApi.login({ email: 'x@y.z', password: 'wrong' }),
    ).rejects.toMatchObject({ message: 'invalid_credentials' });

    expect(handlerCalled).toBe(0);
  });
});

describe('actions.logout', () => {
  it('drops both the in-memory token and the store token', () => {
    api.setApiToken('jwt');
    store.store.set((s) => ({ ...s, loggedIn: true, token: 'jwt' }));

    store.actions.logout();

    expect(api.getApiToken()).toBeNull();
    expect(store.store.get().loggedIn).toBe(false);
    expect(store.store.get().token).toBeNull();
  });
});

describe('email-input normalisation', () => {
  it('lowercases + trims email before hitting forgotPassword', async () => {
    const fetchMock = mockFetch({ sent: true, expiresInSeconds: 600 });

    await store.actions.forgotPassword('  ALICE@Example.COM  ');

    const [, init] = fetchMock.mock.calls[0]!;
    expect(JSON.parse((init as RequestInit).body as string)).toEqual({
      email: 'alice@example.com',
    });
  });

  it('lowercases + trims email before hitting requestEmailChange', async () => {
    api.setApiToken('jwt');
    const fetchMock = mockFetch({ sent: true, expiresInSeconds: 600 });

    await store.actions.requestEmailChange('  NEW@Example.COM  ');

    const [, init] = fetchMock.mock.calls[0]!;
    expect(JSON.parse((init as RequestInit).body as string)).toEqual({
      newEmail: 'new@example.com',
    });
  });

  it('lowercases + trims email before hitting verifyResetCode', async () => {
    const fetchMock = mockFetch({ ok: true });

    await store.actions.verifyResetCode('  BoB@Example.COM ', '123456');

    const [, init] = fetchMock.mock.calls[0]!;
    expect(JSON.parse((init as RequestInit).body as string)).toEqual({
      email: 'bob@example.com',
      code: '123456',
    });
  });
});
