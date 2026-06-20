import * as NavigationBar from 'expo-navigation-bar';
import * as SplashScreen from 'expo-splash-screen';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Appearance, AppState, Platform, StyleSheet, View } from 'react-native';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { LoginScreen } from '@/components/LoginScreen';
import { Onboarding } from '@/components/Onboarding';
import { ServerUnreachable } from '@/components/ServerUnreachable';
import { Toast } from '@/components/ui';
import { actions, hydrate, useStore, useStoreSelector } from '@/lib/store';
import { configurePurchases } from '@/lib/purchases';
import { bootstrapSync } from '@/lib/sync';
import { makeTokens } from '@/lib/tokens';
import { setToastFn, type ToastType } from '@/lib/toast';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [ready, setReady] = useState(false);
  const [toastMsg, setToastMsg] = useState<{ msg: string; type: ToastType } | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    hydrate().then(() => {
      setReady(true);
      SplashScreen.hideAsync().catch(() => {});
    });
  }, []);

  // Initialise RevenueCat once. No-op until the SDK keys are set and the app is
  // rebuilt with the native module, so it is safe to call unconditionally here.
  useEffect(() => {
    configurePurchases();
  }, []);

  useEffect(() => {
    setToastFn((msg, type) => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
      setToastMsg({ msg, type });
      toastTimer.current = setTimeout(() => setToastMsg(null), 5000);
    });
    return () => {
      setToastFn(null);
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, []);

  // Immersive: hide the system navigation bar; it reappears on a swipe up from
  // the bottom edge, then auto-hides again. Re-assert on foreground.
  useEffect(() => {
    if (Platform.OS !== 'android') return;
    const hide = async () => {
      try {
        await NavigationBar.setVisibilityAsync('hidden');
      } catch {
        // native module missing or unsupported API level — non-fatal
      }
    };
    hide();
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') hide();
    });
    return () => sub.remove();
  }, []);

  const s = useStore();
  const dark = useStoreSelector((s) => s.prefs.dark);
  const lang = useStoreSelector((s) => s.prefs.lang);
  const tokens = useMemo(() => makeTokens(dark), [dark]);

  // Force the native appearance to match the in-app theme. Without this the
  // native layer (tab bar, screen backgrounds) follows the OS appearance and
  // flickers light-then-dark when the app theme and system theme disagree.
  useEffect(() => {
    Appearance.setColorScheme(dark ? 'dark' : 'light');
  }, [dark]);

  const loggedIn = useStoreSelector((st) => st.loggedIn);
  const token = useStoreSelector((st) => st.token);

  // Foreground refetch: sync as soon as the app returns to the foreground
  // while the user is logged in. bootstrapSync coalesces concurrent calls so
  // it is safe to fire on every 'active' transition.
  // Polling: every 25 s while active + logged in to keep data near real-time
  // across devices. The interval is cleared on background or logout.
  useEffect(() => {
    if (!ready || !loggedIn || !token) return;

    const POLL_MS = 25_000;
    let pollId: ReturnType<typeof setInterval> | null = null;

    const startPolling = () => {
      if (pollId !== null) return;
      pollId = setInterval(() => {
        void bootstrapSync();
      }, POLL_MS);
    };

    const stopPolling = () => {
      if (pollId !== null) {
        clearInterval(pollId);
        pollId = null;
      }
    };

    // Kick off immediately when the effect mounts (covers the setAuth path
    // where bootstrapSync was already called but this effect ensures polling
    // starts without waiting for the first interval tick).
    startPolling();

    const sub = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        void bootstrapSync();
        startPolling();
      } else {
        stopPolling();
      }
    });

    return () => {
      sub.remove();
      stopPolling();
    };
  }, [ready, loggedIn, token]);

  if (!ready) return null;

  return (
    <KeyboardProvider>
      <SafeAreaProvider>
        <StatusBar style={dark ? 'light' : 'dark'} />
        <Stack
          screenOptions={{
            headerShown: true,
            headerStyle: { backgroundColor: tokens.bg },
            headerTintColor: tokens.accent,
            headerTitleStyle: { color: tokens.text },
            headerShadowVisible: false,
            headerBackButtonDisplayMode: 'minimal',
            contentStyle: { backgroundColor: tokens.bg },
          }}
        >
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen
            name="add"
            options={{
              headerShown: false,
              gestureEnabled: true,
              contentStyle: { backgroundColor: tokens.sheetBg },
            }}
          />
        </Stack>
        {!s.onboarded ? (
          <View style={StyleSheet.absoluteFill}>
            <Onboarding t={tokens} onDone={() => actions.completeOnboarding()} />
          </View>
        ) : !s.loggedIn ? (
          <View style={StyleSheet.absoluteFill}>
            <LoginScreen t={tokens} onDone={() => actions.login()} />
          </View>
        ) : null}
        <Toast
          toast={toastMsg}
          t={tokens}
          onDismiss={() => {
            if (toastTimer.current) clearTimeout(toastTimer.current);
            setToastMsg(null);
          }}
        />
        <ServerUnreachable t={tokens} lang={lang} />
      </SafeAreaProvider>
    </KeyboardProvider>
  );
}
