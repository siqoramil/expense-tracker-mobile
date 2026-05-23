// In-memory SecureStore stub for tests. The real module loads native
// Keychain/EncryptedSharedPreferences bindings that are unavailable under
// node — vitest needs a JS-only stand-in. Aliased in vitest.config.ts.
const memory = new Map<string, string>();

export const setItemAsync = async (key: string, value: string): Promise<void> => {
  memory.set(key, value);
};

export const getItemAsync = async (key: string): Promise<string | null> =>
  memory.get(key) ?? null;

export const deleteItemAsync = async (key: string): Promise<void> => {
  memory.delete(key);
};
