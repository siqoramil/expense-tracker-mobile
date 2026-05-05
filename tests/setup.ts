import { afterEach, vi } from 'vitest';

// Make `fetch` controllable per-test. Each test sets `global.fetch = vi.fn(...)`
// or uses the helpers in api.test.ts.
afterEach(() => {
  vi.restoreAllMocks();
});
