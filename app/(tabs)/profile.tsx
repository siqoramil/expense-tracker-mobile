import { router, type Href } from 'expo-router';
import { useMemo } from 'react';
import { ProfileScreen } from '@/components/screens';
import { TabHeader, useTabHeaderHeight } from '@/components/TabHeader';
import { TabSafeArea } from '@/components/TabSafeArea';
import { actions, useStoreSelector } from '@/lib/store';
import { makeTokens } from '@/lib/tokens';
import { tStr } from '@/lib/i18n';

export default function ProfileRoute() {
  const dark = useStoreSelector((s) => s.prefs.dark);
  const lang = useStoreSelector((s) => s.prefs.lang);
  const t = useMemo(() => makeTokens(dark), [dark]);
  const contentTopPad = useTabHeaderHeight();
  return (
    <TabSafeArea bg={t.bg}>
      <TabHeader t={t} title={tStr(lang, 'profile')} />
      <ProfileScreen
        t={t}
        contentTopPad={contentTopPad}
        onNav={(screen) => router.push(`/${screen}` as Href)}
        onLogout={() => {
          void actions.logout();
        }}
      />
    </TabSafeArea>
  );
}
