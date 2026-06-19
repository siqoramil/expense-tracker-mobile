import { router } from 'expo-router';
import { useMemo } from 'react';
import { StatsScreen } from '@/components/screens';
import { TabHeader, useTabHeaderHeight } from '@/components/TabHeader';
import { TabSafeArea } from '@/components/TabSafeArea';
import { makeTokens } from '@/lib/tokens';
import { tStr } from '@/lib/i18n';
import { useStoreSelector } from '@/lib/store';

export default function StatsRoute() {
  const dark = useStoreSelector((s) => s.prefs.dark);
  const lang = useStoreSelector((s) => s.prefs.lang);
  const t = useMemo(() => makeTokens(dark), [dark]);
  const contentTopPad = useTabHeaderHeight();
  return (
    <TabSafeArea bg={t.bg}>
      <TabHeader
        t={t}
        title={tStr(lang, 'statistics')}
        onAdd={() => router.push('/add?mode=expense')}
      />
      <StatsScreen t={t} contentTopPad={contentTopPad} />
    </TabSafeArea>
  );
}
