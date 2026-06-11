import { router } from 'expo-router';
import { useMemo } from 'react';
import { DebtorsScreen } from '../../components/screens/DebtorsScreen';
import { TabHeader } from '../../components/TabHeader';
import { TabSafeArea } from '../../components/TabSafeArea';
import { tStr } from '../../lib/i18n';
import { useStoreSelector } from '../../lib/store';
import { makeTokens } from '../../lib/tokens';

export default function DebtorsRoute() {
  const dark = useStoreSelector((s) => s.prefs.dark);
  const lang = useStoreSelector((s) => s.prefs.lang);
  const t = useMemo(() => makeTokens(dark), [dark]);
  return (
    <TabSafeArea bg={t.bg}>
      <TabHeader t={t} title={tStr(lang, 'debtors')} onAdd={() => router.push('/add?mode=debt')} />
      <DebtorsScreen t={t} onOpen={(d) => router.push(`/debtor/${d.id}`)} />
    </TabSafeArea>
  );
}
