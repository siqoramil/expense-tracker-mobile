import { Stack } from 'expo-router';
import { AccountScreen } from '../components/screens/AccountScreen';
import { tStr } from '../lib/i18n';
import { useStore } from '../lib/store';
import { makeTokens } from '../lib/tokens';

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
