import { Stack, router } from 'expo-router';
import { AllTxScreen } from '../components/screens/AllTxScreen';
import { tStr } from '../lib/i18n';
import { useStore } from '../lib/store';
import { makeTokens } from '../lib/tokens';

export default function AllTxRoute() {
  const s = useStore();
  const t = makeTokens(s.prefs.dark);
  const lang = s.prefs.lang;
  return (
    <>
      <Stack.Screen options={{ title: tStr(lang, 'allTransactions') }} />
      <AllTxScreen t={t} onOpenTx={(tx) => router.push(`/tx/${tx.id}`)} />
    </>
  );
}
