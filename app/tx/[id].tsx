import { Stack, router, useLocalSearchParams } from 'expo-router';
import { TxDetail } from '../../components/screens/TxDetail';
import { tStr } from '../../lib/i18n';
import { useStore } from '../../lib/store';
import { makeTokens } from '../../lib/tokens';

export default function TxDetailRoute() {
  const s = useStore();
  const t = makeTokens(s.prefs.dark);
  const lang = s.prefs.lang;
  const { id } = useLocalSearchParams<{ id: string }>();
  const tx = s.tx.find((x) => x.id === id);
  if (!tx) return null;
  return (
    <>
      <Stack.Screen options={{ title: tStr(lang, 'transactionDetail') }} />
      <TxDetail t={t} tx={tx} onEdit={(x) => router.push(`/add?editId=${x.id}`)} />
    </>
  );
}
