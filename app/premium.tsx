import { Stack, useRouter } from 'expo-router';
import { PaywallScreen } from '@/components/screens';
import { useStore } from '@/lib/store';
import { makeTokens } from '@/lib/tokens';
import { tStr } from '@/lib/i18n';

export default function PremiumRoute() {
  const s = useStore();
  const t = makeTokens(s.prefs.dark);
  const lang = s.prefs.lang;
  const router = useRouter();

  return (
    <>
      <Stack.Screen options={{ title: tStr(lang, 'premium') }} />
      <PaywallScreen t={t} onDone={() => router.back()} />
    </>
  );
}
