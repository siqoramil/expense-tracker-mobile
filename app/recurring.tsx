import { Stack } from 'expo-router';
import { RecurringScreen } from '../components/screens/RecurringScreen';
import { tStr } from '../lib/i18n';
import { useStore } from '../lib/store';
import { makeTokens } from '../lib/tokens';
export default function RecurringRoute() {
  const s = useStore();
  const t = makeTokens(s.prefs.dark);
  const lang = s.prefs.lang;
  return (
    <>
      <Stack.Screen options={{ title: tStr(lang, 'recurring') }} />
      <RecurringScreen t={t} />
    </>
  );
}
