import { router, type Href } from 'expo-router';
import { useMemo } from 'react';
import { HomeScreen } from '../../components/screens/HomeScreen';
import { TabSafeArea } from '../../components/TabSafeArea';
import { useStoreSelector } from '../../lib/store';
import { makeTokens } from '../../lib/tokens';

export default function HomeRoute() {
  const dark = useStoreSelector((s) => s.prefs.dark);
  const t = useMemo(() => makeTokens(dark), [dark]);
  return (
    <TabSafeArea bg={t.bg}>
      <HomeScreen
        t={t}
        onNav={(screen) => router.push(`/${screen}` as Href)}
        onAdd={(mode) => router.push(`/add?mode=${mode}`)}
        onOpenTx={(tx) => router.push(`/tx/${tx.id}`)}
      />
    </TabSafeArea>
  );
}
