// In-memory AsyncStorage stub for tests. Reset between tests via
// `(asyncStorage as any).__reset()` if needed.
const memory = new Map<string, string>();

const asyncStorage = {
  getItem: async (key: string): Promise<string | null> => memory.get(key) ?? null,
  setItem: async (key: string, value: string): Promise<void> => {
    memory.set(key, value);
  },
  removeItem: async (key: string): Promise<void> => {
    memory.delete(key);
  },
  clear: async (): Promise<void> => {
    memory.clear();
  },
  __reset: () => memory.clear(),
};

export default asyncStorage;
