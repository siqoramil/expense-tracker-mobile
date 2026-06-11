import { Stack } from 'expo-router';
import { WalletsScreen } from '../components/screens/WalletsScreen';
import { tStr } from '../lib/i18n';
import { useStore } from '../lib/store';
import { makeTokens } from '../lib/tokens';
export default function WalletsRoute() {
  const s = useStore();
  const t = makeTokens(s.prefs.dark);
  const lang = s.prefs.lang;
  return (
    <>
      <Stack.Screen options={{ title: tStr(lang, 'wallets') }} />
      <WalletsScreen t={t} />
    </>
  );
}
