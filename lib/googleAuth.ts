import type * as GoogleProvider from 'expo-auth-session/providers/google';

type GoogleModule = typeof GoogleProvider;

// Try to load expo-auth-session at module-eval time. If the underlying
// native modules (e.g. ExpoApplication) are missing — typically because the
// dev client was built before they were added — fall back to a no-op stub
// so the app still loads. The Google button will simply report
// "unavailable" until a fresh build is installed.
let googleModule: GoogleModule | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  googleModule = require('expo-auth-session/providers/google');
} catch {
  googleModule = null;
}

let webBrowserCompleted = false;
const ensureWebBrowserCompleted = () => {
  if (webBrowserCompleted) return;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const wb = require('expo-web-browser');
    wb.maybeCompleteAuthSession?.();
  } catch {
    // ignore — already failed to load above
  }
  webBrowserCompleted = true;
};
ensureWebBrowserCompleted();

export const isGoogleAuthAvailable = () => googleModule !== null;

type AuthSessionResult = {
  type: 'success' | 'cancel' | 'dismiss' | 'opened' | 'locked' | 'error';
  params?: { id_token?: string };
};

const noopAsync = async (): Promise<AuthSessionResult> => ({ type: 'dismiss' });

const noopHook = (
  _config: Parameters<GoogleModule['useIdTokenAuthRequest']>[0],
): readonly [null, AuthSessionResult | null, typeof noopAsync] => [null, null, noopAsync];

export const useGoogleIdTokenAuthRequest = (googleModule?.useIdTokenAuthRequest ??
  noopHook) as GoogleModule['useIdTokenAuthRequest'];
