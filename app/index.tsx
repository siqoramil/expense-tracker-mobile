import React, { useCallback, useEffect, useRef, useState } from 'react';
import { BackHandler } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AddSheet, type AddMode } from '../components/AddSheet';
import { LoginScreen } from '../components/LoginScreen';
import { Onboarding } from '../components/Onboarding';
import { TabBar, type TabKey } from '../components/TabBar';
import { AllTxScreen } from '../components/screens/AllTxScreen';
import { BudgetsScreen } from '../components/screens/BudgetsScreen';
import { CalendarScreen } from '../components/screens/CalendarScreen';
import { CategoriesScreen } from '../components/screens/CategoriesScreen';
import { DebtorDetail } from '../components/screens/DebtorDetail';
import { DebtorsScreen } from '../components/screens/DebtorsScreen';
import { HomeScreen } from '../components/screens/HomeScreen';
import { NotificationsScreen } from '../components/screens/NotificationsScreen';
import { ProfileScreen } from '../components/screens/ProfileScreen';
import { RecurringScreen } from '../components/screens/RecurringScreen';
import { ReportsScreen } from '../components/screens/ReportsScreen';
import {
  CurrencyScreen,
  LanguageScreen,
  SecurityScreen,
} from '../components/screens/SettingsSubs';
import { StatsScreen } from '../components/screens/StatsScreen';
import { TxDetail } from '../components/screens/TxDetail';
import { WalletsScreen } from '../components/screens/WalletsScreen';
import { Toast } from '../components/ui';
import { actions, useStore, type Debt, type Transaction } from '../lib/store';

import { setToastFn } from '../lib/toast';
import { makeTokens } from '../lib/tokens';

type StackEntry =
  | { screen: 'all-tx' }
  | { screen: 'notifications' }
  | { screen: 'budgets' }
  | { screen: 'categories' }
  | { screen: 'wallets' }
  | { screen: 'calendar' }
  | { screen: 'reports' }
  | { screen: 'language' }
  | { screen: 'currency' }
  | { screen: 'security' }
  | { screen: 'recurring' }
  | { screen: 'debtor'; data: Debt }
  | { screen: 'tx'; data: Transaction };

type AddState = { mode?: AddMode; edit?: Transaction } | null;

export default function AppRoot() {
  const s = useStore();
  const t = makeTokens(s.prefs.dark);

  const [tab, setTab] = useState<TabKey>('home');
  const [navStack, setNavStack] = useState<StackEntry[]>([]);
  const [add, setAdd] = useState<AddState>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const fadeOpacity = useSharedValue(0);
  const contentScale = useSharedValue(1);
  const prevBg = useRef(t.bg);
  const [overlayBg, setOverlayBg] = useState(t.bg);

  useEffect(() => {
    if (prevBg.current !== t.bg) {
      setOverlayBg(prevBg.current);
      fadeOpacity.value = 1;
      fadeOpacity.value = withTiming(0, {
        duration: 420,
        easing: Easing.out(Easing.cubic),
      });
      contentScale.value = 0.985;
      contentScale.value = withSpring(1, {
        damping: 18,
        stiffness: 160,
        mass: 0.8,
      });
      prevBg.current = t.bg;
    }
  }, [t.bg, fadeOpacity, contentScale]);

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: fadeOpacity.value,
  }));
  const contentStyle = useAnimatedStyle(() => ({
    transform: [{ scale: contentScale.value }],
  }));

  useEffect(() => {
    setToastFn((msg) => {
      setToastMsg(msg);
      setTimeout(() => setToastMsg(null), 1800);
    });
    return () => setToastFn(null);
  }, []);

  const push = useCallback((entry: StackEntry) => setNavStack((st) => [...st, entry]), []);
  const pop = useCallback(() => setNavStack((st) => st.slice(0, -1)), []);

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (navStack.length > 0) {
        pop();
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, [navStack.length, pop]);

  const onNav = useCallback(
    (screen: string, data?: unknown) => {
      if (screen === 'debtor') push({ screen: 'debtor', data: data as Debt });
      else if (screen === 'tx') push({ screen: 'tx', data: data as Transaction });
      else push({ screen } as StackEntry);
    },
    [push],
  );

  let rootContent: React.ReactNode = null;
  if (!s.onboarded) {
    rootContent = <Onboarding t={t} onDone={() => actions.completeOnboarding()} />;
  } else if (!s.loggedIn) {
    rootContent = <LoginScreen t={t} onDone={() => actions.login()} />;
  } else if (navStack.length > 0) {
    const top = navStack[navStack.length - 1];
    switch (top.screen) {
      case 'all-tx':
        rootContent = (
          <AllTxScreen t={t} onBack={pop} onOpenTx={(tx) => push({ screen: 'tx', data: tx })} />
        );
        break;
      case 'notifications':
        rootContent = <NotificationsScreen t={t} onBack={pop} />;
        break;
      case 'budgets':
        rootContent = <BudgetsScreen t={t} onBack={pop} />;
        break;
      case 'categories':
        rootContent = <CategoriesScreen t={t} onBack={pop} />;
        break;
      case 'wallets':
        rootContent = <WalletsScreen t={t} onBack={pop} />;
        break;
      case 'calendar':
        rootContent = <CalendarScreen t={t} onBack={pop} />;
        break;
      case 'reports':
        rootContent = <ReportsScreen t={t} onBack={pop} />;
        break;
      case 'language':
        rootContent = <LanguageScreen t={t} onBack={pop} />;
        break;
      case 'currency':
        rootContent = <CurrencyScreen t={t} onBack={pop} />;
        break;
      case 'security':
        rootContent = <SecurityScreen t={t} onBack={pop} />;
        break;
      case 'recurring':
        rootContent = <RecurringScreen t={t} onBack={pop} />;
        break;
      case 'debtor':
        rootContent = <DebtorDetail t={t} debtor={top.data} onBack={pop} />;
        break;
      case 'tx':
        rootContent = (
          <TxDetail
            t={t}
            tx={top.data}
            onBack={pop}
            onEdit={(tx) => {
              pop();
              setAdd({ edit: tx });
            }}
          />
        );
        break;
    }
  } else {
    switch (tab) {
      case 'home':
        rootContent = (
          <HomeScreen
            t={t}
            onNav={onNav}
            onAdd={(mode) => setAdd({ mode })}
            onOpenTx={(tx) => push({ screen: 'tx', data: tx })}
          />
        );
        break;
      case 'stats':
        rootContent = <StatsScreen t={t} />;
        break;
      case 'debtors':
        rootContent = (
          <DebtorsScreen t={t} onOpen={(d) => push({ screen: 'debtor', data: d })} onAdd={() => setAdd({ mode: 'debt' })} />
        );
        break;
      case 'profile':
        rootContent = (
          <ProfileScreen
            t={t}
            onNav={onNav}
            onLogout={() => {
              void actions.logout();
            }}
          />
        );
        break;
    }
  }

  const showChrome = s.onboarded && s.loggedIn;
  const editTx = add?.edit ?? null;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }} edges={['top']}>
      <Animated.View style={[{ flex: 1, backgroundColor: t.bg }, contentStyle]}>
        {rootContent}
        {showChrome && navStack.length === 0 ? (
          <TabBar
            t={t}
            active={tab}
            onChange={setTab}
            onFab={() => setAdd({ mode: 'expense' })}
            lang={s.prefs.lang}
          />
        ) : null}
        <Toast toast={toastMsg} t={t} />
        <AddSheet
          t={t}
          visible={!!add}
          mode={add?.mode}
          editTx={editTx}
          onClose={() => setAdd(null)}
        />
      </Animated.View>
      <Animated.View
        pointerEvents="none"
        style={[
          {
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: overlayBg,
          },
          overlayStyle,
        ]}
      />
    </SafeAreaView>
  );
}
