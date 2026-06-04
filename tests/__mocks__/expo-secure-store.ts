// In-memory SecureStore stub for tests. The real module loads native
// Keychain/EncryptedSharedPreferences bindings that are unavailable under
// node — vitest needs a JS-only stand-in. Aliased in vitest.config.ts.
const memory = new Map<string, string>();

export type SecureStoreOptions = { keychainAccessible?: number };

// Mirror the real module's iOS-side accessibility constants. We only
// reference WHEN_UNLOCKED_THIS_DEVICE_ONLY in app code; the rest are
// here so a future caller can be swapped in without expanding the mock.
export const WHEN_UNLOCKED_THIS_DEVICE_ONLY = 0;
export const AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY = 1;
export const ALWAYS_THIS_DEVICE_ONLY = 2;

export const setItemAsync = async (
  key: string,
  value: string,
  _opts?: SecureStoreOptions,
): Promise<void> => {
  memory.set(key, value);
};

export const getItemAsync = async (
  key: string,
  _opts?: SecureStoreOptions,
): Promise<string | null> => memory.get(key) ?? null;

export const deleteItemAsync = async (key: string, _opts?: SecureStoreOptions): Promise<void> => {
  memory.delete(key);
};
