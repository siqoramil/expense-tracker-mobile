import { Stack } from 'expo-router';
import { AccountScreen } from '@/components/screens';
import { makeTokens } from '@/lib/tokens';
import { tStr } from '@/lib/i18n';
import { useStore } from '@/lib/store';

export default function AccountRoute() {
  const s = useStore();
  const t = makeTokens(s.prefs.dark);
  const lang = s.prefs.lang;
  return (
    <>
      <Stack.Screen options={{ title: tStr(lang, 'account') }} />
      <AccountScreen t={t} />
    </>
  );
}
