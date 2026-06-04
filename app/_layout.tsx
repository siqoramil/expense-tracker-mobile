import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ServerUnreachable } from '../components/ServerUnreachable';
import { hydrate, useStore } from '../lib/store';
import { makeTokens } from '../lib/tokens';

export default function RootLayout() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    hydrate().then(() => setReady(true));
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
