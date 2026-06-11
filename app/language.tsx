import { Stack } from 'expo-router';
import { LanguageScreen } from '../components/screens/SettingsSubs';
import { tStr } from '../lib/i18n';
import { useStore } from '../lib/store';
import { makeTokens } from '../lib/tokens';

export default function LanguageRoute() {
  const s = useStore();
  const t = makeTokens(s.prefs.dark);
  const lang = s.prefs.lang;
  return (
    <>
      <Stack.Screen options={{ title: tStr(lang, 'language') }} />
      <LanguageScreen t={t} />
    </>
  );
}
