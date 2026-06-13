import { Stack } from 'expo-router';
import { ReportsScreen } from '@/components/screens';
import { makeTokens } from '@/lib/tokens';
import { tStr } from '@/lib/i18n';
import { useStore } from '@/lib/store';

export default function ReportsRoute() {
  const s = useStore();
  const t = makeTokens(s.prefs.dark);
  const lang = s.prefs.lang;
  return (
    <>
      <Stack.Screen options={{ title: tStr(lang, 'reports') }} />
      <ReportsScreen t={t} />
    </>
  );
}
