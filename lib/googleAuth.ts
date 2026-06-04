import Constants from 'expo-constants';

type GoogleConfig = {
  googleWebClientId?: string;
  googleIosClientId?: string;
  googleAndroidClientId?: string;
};

const cfg = (Constants.expoConfig?.extra ?? {}) as GoogleConfig;

type GoogleSigninModule = typeof import('@react-native-google-signin/google-signin');

// Lazy-require the native module so the app still loads if it is missing — e.g.
// an old dev client built before it was added. The Google button reports
// "unavailable" until a fresh build with the native module is installed.
let mod: GoogleSigninModule | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  mod = require('@react-native-google-signin/google-signin');
} catch {
  mod = null;
}

let configured = false;
const ensureConfigured = (m: GoogleSigninModule) => {
  if (configured) return;
  m.GoogleSignin.configure({
    webClientId: cfg.googleWebClientId,
    iosClientId: cfg.googleIosClientId,
    offlineAccess: false,
  });
  configured = true;
};

export const isGoogleAuthAvailable = () =>
  mod !== null && !!(cfg.googleWebClientId || cfg.googleIosClientId || cfg.googleAndroidClientId);

export type GoogleSignInResult =
  | { type: 'success'; idToken: string }
  | { type: 'cancel' }
  | { type: 'error'; message: string };

// Native Google Sign-In (no browser, no redirect URI). The Android OAuth client
// is matched by package name + SHA-1; the returned id token is signed for the
// web client id, which the server verifies.
export const signInWithGoogle = async (): Promise<GoogleSignInResult> => {
  if (!mod) return { type: 'error', message: 'unavailable' };
  const m = mod;
  ensureConfigured(m);
  try {
    await m.GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    const response = await m.GoogleSignin.signIn();
    if (m.isSuccessResponse(response)) {
      const idToken = response.data.idToken;
      if (!idToken) return { type: 'error', message: 'no_id_token' };
      return { type: 'success', idToken };
    }
    return { type: 'cancel' };
  } catch (e) {
    if (m.isErrorWithCode(e) && e.code === m.statusCodes.SIGN_IN_CANCELLED) {
      return { type: 'cancel' };
    }
    return { type: 'error', message: e instanceof Error ? e.message : 'sign_in_failed' };
  }
};
