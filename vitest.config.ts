import { defineConfig } from 'vitest/config';

// Mobile sources import RN/Expo packages that don't run in node. We swap
// the handful that lib/api.ts and lib/store.ts touch for tiny stubs in
// tests/__mocks__. Component-level tests would need a heavier setup
// (jsdom + RN testing library) and are deliberately out of scope here —
// these tests target pure logic in api.ts and store.ts.
export default defineConfig({
  test: {
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/**/*.test.ts'],
    environment: 'node',
  },
  resolve: {
    alias: {
      'expo-constants': new URL('./tests/__mocks__/expo-constants.ts', import.meta.url).pathname,
      '@react-native-async-storage/async-storage': new URL(
        './tests/__mocks__/async-storage.ts',
        import.meta.url,
      ).pathname,
      'expo-secure-store': new URL('./tests/__mocks__/expo-secure-store.ts', import.meta.url)
        .pathname,
      'react-i18next': new URL('./tests/__mocks__/react-i18next.ts', import.meta.url).pathname,
    },
  },
});
