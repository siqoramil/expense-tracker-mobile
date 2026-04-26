import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { hydrate, useStore } from '../lib/store';

export default function RootLayout() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    hydrate().then(() => setReady(true));
  }, []);
  const s = useStore();

  if (!ready) return null;

  return (
    <SafeAreaProvider>
      <StatusBar style={s.prefs.dark ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: s.prefs.dark ? '#0B0B0F' : '#F4F4F5' } }} />
    </SafeAreaProvider>
  );
}
