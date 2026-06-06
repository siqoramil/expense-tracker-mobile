import * as NavigationBar from 'expo-navigation-bar';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { AppState, Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ServerUnreachable } from '../components/ServerUnreachable';
import { hydrate, useStore } from '../lib/store';
import { makeTokens } from '../lib/tokens';

export default function RootLayout() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    hydrate().then(() => setReady(true));
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

  if (!ready) return null;

  const tokens = makeTokens(s.prefs.dark);
  const lang = s.prefs.lang;

  return (
    <SafeAreaProvider>
      <StatusBar style={s.prefs.dark ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: s.prefs.dark ? '#0B0B0F' : '#F4F4F5' },
        }}
      />
      <ServerUnreachable t={tokens} lang={lang} />
    </SafeAreaProvider>
  );
}
