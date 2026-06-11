import * as NavigationBar from 'expo-navigation-bar';
import * as SplashScreen from 'expo-splash-screen';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Appearance, AppState, Platform, StyleSheet, View } from 'react-native';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { LoginScreen } from '../components/LoginScreen';
import { Onboarding } from '../components/Onboarding';
import { ServerUnreachable } from '../components/ServerUnreachable';
import { Toast } from '../components/ui';
import { actions, hydrate, useStore, useStoreSelector } from '../lib/store';
import { setToastFn, type ToastType } from '../lib/toast';
import { makeTokens } from '../lib/tokens';

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
              presentation: 'formSheet',
              headerShown: false,
              gestureEnabled: true,
              sheetGrabberVisible: true,
              sheetCornerRadius: 32,
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
