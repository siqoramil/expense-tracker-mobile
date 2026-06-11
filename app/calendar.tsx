import { Stack, useRouter } from 'expo-router';
import { CalendarScreen } from '../components/screens/CalendarScreen';
import { tStr } from '../lib/i18n';
import { useStore } from '../lib/store';
import { makeTokens } from '../lib/tokens';

export default function CalendarRoute() {
  const s = useStore();
  const t = makeTokens(s.prefs.dark);
  const lang = s.prefs.lang;
  const router = useRouter();
  return (
    <>
      <Stack.Screen options={{ title: tStr(lang, 'calendar') }} />
      <CalendarScreen
        t={t}
        onOpenTx={(tx) => router.push(`/tx/${tx.id}`)}
      />
    </>
  );
}
