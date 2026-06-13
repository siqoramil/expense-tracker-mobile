import { router, Tabs, usePathname } from 'expo-router';
import { Icon as NativeTabIcon, Label, NativeTabs } from 'expo-router/unstable-native-tabs';
import { Platform } from 'react-native';
import { TabBar, type TabKey } from '@/components/TabBar';
import { makeTokens } from '@/lib/tokens';
import { tStr } from '@/lib/i18n';
import { useStore } from '@/lib/store';

export default function TabsLayout() {
  const s = useStore();
  const t = makeTokens(s.prefs.dark);
  const lang = s.prefs.lang;
  const pathname = usePathname();

  // iOS 26+: use the real native tab bar — it ships Apple's Liquid Glass for
  // free. The center "+" lives as a floating accent button (the native bar has
  // no center slot). Tab screens have no top header here (Home has its own).
  if (Platform.OS === 'ios') {
    return (
      <NativeTabs
        tintColor={t.accent}
        blurEffect={t.dark ? 'systemChromeMaterialDark' : 'systemChromeMaterialLight'}
      >
        <NativeTabs.Trigger name="index">
          <Label>{tStr(lang, 'home')}</Label>
          <NativeTabIcon sf={{ default: 'house', selected: 'house.fill' }} />
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="stats">
          <Label>{tStr(lang, 'statistics')}</Label>
          <NativeTabIcon sf={{ default: 'chart.bar', selected: 'chart.bar.fill' }} />
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="debtors">
          <Label>{tStr(lang, 'debtors')}</Label>
          <NativeTabIcon sf={{ default: 'person.2', selected: 'person.2.fill' }} />
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="profile">
          <Label>{tStr(lang, 'profile')}</Label>
          <NativeTabIcon sf={{ default: 'person', selected: 'person.fill' }} />
        </NativeTabs.Trigger>
      </NativeTabs>
    );
  }

  // Android (and older iOS): our custom floating curved FAB tab bar.
  const active: TabKey = pathname.startsWith('/stats')
    ? 'stats'
    : pathname.startsWith('/debtors')
      ? 'debtors'
      : pathname.startsWith('/profile')
        ? 'profile'
        : 'home';

  const go = (k: TabKey) => {
    switch (k) {
      case 'home':
        router.navigate('/');
        break;
      case 'stats':
        router.navigate('/stats');
        break;
      case 'debtors':
        router.navigate('/debtors');
        break;
      case 'profile':
        router.navigate('/profile');
        break;
    }
  };

  return (
    <>
      <Tabs tabBar={() => null} screenOptions={{ headerShown: false }} />
      <TabBar
        t={t}
        lang={lang}
        active={active}
        onChange={go}
        onFab={() => router.push('/add?mode=expense')}
      />
    </>
  );
}
