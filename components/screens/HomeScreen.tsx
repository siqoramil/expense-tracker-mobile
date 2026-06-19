import React, { memo, useMemo, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View, type ViewStyle } from 'react-native';
import Reanimated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { Tokens } from '@/lib/tokens';
import { Card, EmptyState, IconButton, SectionHeader, TxRow } from '@/components/ui';
import { Icon, type IconName } from '@/components/Icon';
import { Sparkline } from '@/components/Sparkline';
import { actions, selectMonth, type Transaction, type Wallet, useStore, walletName } from '@/lib/store';
import { fmtMoney, isoDate, last6Months, today, type Currency, unitOf } from '@/lib/format';
import { tStr, type Lang } from '@/lib/i18n';

// Height of the home header title/action row (below safe-area top).
const HOME_HEADER_ROW_H = 72;

type Nav = (screen: string, data?: unknown) => void;

type Props = {
  t: Tokens;
  onNav: Nav;
  onAdd: (mode: 'income' | 'expense' | 'debt') => void;
  onOpenTx: (tx: Transaction) => void;
};

export const HomeScreen: React.FC<Props> = ({ t, onNav, onAdd, onOpenTx }) => {
  const s = useStore();
  const lang = s.prefs.lang;
  const months = last6Months();
  const [monthIdx, setMonthIdx] = useState(months.length - 1);
  const month = months[monthIdx];
  const monthData = selectMonth(s, month.key);
  const hideBalance = s.hideBalance;
  const [monthPickerOpen, setMonthPickerOpen] = useState(false);
  const insets = useSafeAreaInsets();

  const greeting = useMemo(() => {
    const h = new Date().getHours();
    if (h < 12) return tStr(lang, 'goodMorning');
    if (h < 18) return tStr(lang, 'goodAfternoon');
    return tStr(lang, 'goodEvening');
  }, [lang]);

  const net = monthData.net;
  const income = monthData.income;
  const expense = monthData.expense;
  const pctSaved = income > 0 ? Math.round((net / income) * 100) : 0;

  const totalBalance = useMemo(
    () => s.wallets.filter((w) => !w.hidden).reduce((a, w) => a + w.balance, 0),
    [s.wallets],
  );

  const spark = useMemo(() => {
    const byDate: Record<string, number> = {};
    s.tx.forEach((x) => {
      if (x.kind === 'expense') byDate[x.date] = (byDate[x.date] || 0) + x.amount;
    });
    const days: number[] = [];
    const tdy = today();
    for (let i = 13; i >= 0; i--) {
      const d = new Date(tdy);
      d.setDate(tdy.getDate() - i);
      days.push(byDate[isoDate(d)] || 0);
    }
    return days;
  }, [s.tx]);

  const upcoming = useMemo(
    () =>
      s.recurring
        .filter((r) => r.enabled && r.kind === 'expense')
        .sort((a, b) => a.nextDate.localeCompare(b.nextDate))
        .slice(0, 3),
    [s.recurring],
  );

  const unreadNotifs = useMemo(() => s.notifs.filter((n) => !n.read).length, [s.notifs]);

  const goalPct = s.goal ? Math.round((s.goal.saved / s.goal.target) * 100) : 0;

  const nextBillDays = useMemo(() => {
    if (upcoming.length === 0) return null;
    const d = new Date(upcoming[0].nextDate);
    const tdy = today();
    return Math.round((d.getTime() - tdy.getTime()) / 86_400_000);
  }, [upcoming]);

  const recentTx = useMemo(
    () =>
      [...monthData.tx]
        .sort((a, b) => b.date.localeCompare(a.date) || (b.time ?? '').localeCompare(a.time ?? ''))
        .slice(0, 6),
    [monthData.tx],
  );

  // Header content (greeting + name + action buttons) — shared between both platforms.
  const headerContent = (
    <View
      style={{
        height: HOME_HEADER_ROW_H,
        paddingHorizontal: 20,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      <View>
        <Text style={{ fontSize: 13, color: t.textSec, fontWeight: '500', marginBottom: 3 }}>
          {greeting}
        </Text>
        <Text style={{ fontSize: 26, fontWeight: '700', color: t.text, letterSpacing: -0.6 }}>
          {s.profile.name.split(' ')[0]}
        </Text>
      </View>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <IconButton
          icon={hideBalance ? 'eye-off' : 'eye'}
          onPress={() => actions.toggleHideBalance()}
          t={t}
        />
        <IconButton
          icon="bell"
          onPress={() => onNav('notifications')}
          t={t}
          badge={unreadNotifs}
        />
        {Platform.OS === 'ios' ? (
          <Pressable
            onPress={() => onAdd('expense')}
            style={({ pressed }) => ({
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: t.accent,
              alignItems: 'center',
              justifyContent: 'center',
              shadowColor: t.accent,
              shadowOpacity: 0.35,
              shadowRadius: 10,
              shadowOffset: { width: 0, height: 4 },
              transform: [{ scale: pressed ? 0.94 : 1 }],
            })}
          >
            <Icon name="plus" size={20} color="#fff" stroke={2.5} />
          </Pressable>
        ) : null}
      </View>
    </View>
  );

  const iosBarHeight = insets.top + HOME_HEADER_ROW_H;

  // iOS: floating glass header + scroll content padded below it.
  if (Platform.OS === 'ios') {
    const floatingHeader = (() => {
      const statusSpacer = <View style={{ height: insets.top }} />;
      const barStyle: ViewStyle = {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: iosBarHeight,
        zIndex: 100,
      };
      // Plain opaque header — no liquid glass / blur.
      return (
        <Reanimated.View
          entering={FadeInDown.delay(0).duration(400).springify()}
          style={[barStyle, { backgroundColor: t.bg, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: t.divider }]}
          pointerEvents="box-none"
        >
          {statusSpacer}
          {headerContent}
        </Reanimated.View>
      );
    })();

    return (
      <View style={{ flex: 1 }}>
        {floatingHeader}
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 160, paddingTop: iosBarHeight }}
        >
          {/* ── Hero card ── */}
      <Reanimated.View entering={FadeInDown.delay(60).duration(420).springify()} style={{ paddingHorizontal: 20, paddingBottom: 14 }}>
        <HeroCard
          t={t}
          totalBalance={totalBalance}
          hideBalance={hideBalance}
          currency={s.prefs.currency}
          lang={lang}
          pctSaved={pctSaved}
          net={net}
          income={income}
          expense={expense}
          month={month}
          months={months}
          monthIdx={monthIdx}
          onSelectMonth={(i) => { setMonthIdx(i); setMonthPickerOpen(false); }}
          monthPickerOpen={monthPickerOpen}
          onTogglePicker={() => setMonthPickerOpen((v) => !v)}
          spark={spark}
        />
      </Reanimated.View>

      {/* ── Quick-add row ── */}
      <Reanimated.View
        entering={FadeInDown.delay(140).duration(420).springify()}
        style={{
          paddingHorizontal: 20,
          paddingBottom: 20,
          flexDirection: 'row',
          gap: 10,
        }}
      >
        <QuickAction
          icon="arrow-down-left"
          label={tStr(lang, 'addIncome')}
          color={t.income}
          bg={t.incomeSoft}
          t={t}
          onPress={() => onAdd('income')}
        />
        <QuickAction
          icon="arrow-up-right"
          label={tStr(lang, 'addExpense')}
          color={t.expense}
          bg={t.expenseSoft}
          t={t}
          onPress={() => onAdd('expense')}
        />
        <QuickAction
          icon="users"
          label={tStr(lang, 'lend')}
          color={t.accent}
          bg={t.accentSoft}
          t={t}
          onPress={() => onAdd('debt')}
        />
      </Reanimated.View>

      {/* ── 2×2 Stat grid ── */}
      <Reanimated.View
        entering={FadeInDown.delay(200).duration(420).springify()}
        style={{
          paddingHorizontal: 20,
          paddingBottom: 20,
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: 10,
        }}
      >
        {/* Income */}
        <Pressable
          onPress={() => onNav('all-tx')}
          style={({ pressed }) => [statCardBase(t), pressed && { opacity: 0.82, transform: [{ scale: 0.97 }] }]}
        >
          <View style={[statIconWrap, { backgroundColor: t.incomeSoft }]}>
            <Icon name="arrow-down-left" size={18} color={t.income} stroke={2.2} />
          </View>
          <Text style={[statLabel, { color: t.textSec }]}>{tStr(lang, 'income')}</Text>
          <BlurMoney
            value={fmtMoney(income, s.prefs.currency)}
            hidden={hideBalance}
            color={t.text}
            size={20}
          />
          {unitOf(s.prefs.currency) ? (
            <Text style={{ fontSize: 11, color: t.textTer, marginTop: 1 }}>
              {unitOf(s.prefs.currency)}
            </Text>
          ) : null}
        </Pressable>

        {/* Expense */}
        <Pressable
          onPress={() => onNav('all-tx')}
          style={({ pressed }) => [statCardBase(t), pressed && { opacity: 0.82, transform: [{ scale: 0.97 }] }]}
        >
          <View style={[statIconWrap, { backgroundColor: t.expenseSoft }]}>
            <Icon name="arrow-up-right" size={18} color={t.expense} stroke={2.2} />
          </View>
          <Text style={[statLabel, { color: t.textSec }]}>{tStr(lang, 'expenses')}</Text>
          <BlurMoney
            value={fmtMoney(expense, s.prefs.currency)}
            hidden={hideBalance}
            color={t.text}
            size={20}
          />
          {unitOf(s.prefs.currency) ? (
            <Text style={{ fontSize: 11, color: t.textTer, marginTop: 1 }}>
              {unitOf(s.prefs.currency)}
            </Text>
          ) : null}
        </Pressable>

        {/* Goal or Saved % */}
        {s.goal ? (
          <View style={statCardBase(t)}>
            <View style={[statIconWrap, { backgroundColor: '#F59E0B22' }]}>
              <Icon name="trending-up" size={18} color="#F59E0B" stroke={2.2} />
            </View>
            <Text style={[statLabel, { color: t.textSec }]}>{tStr(lang, 'savingsGoal')}</Text>
            <Text
              style={{
                fontSize: 20,
                fontWeight: '700',
                color: t.text,
                letterSpacing: -0.4,
                marginTop: 2,
              }}
            >
              {goalPct}%
            </Text>
            <View
              style={{
                height: 4,
                borderRadius: 2,
                backgroundColor: t.surfaceAlt,
                overflow: 'hidden',
                marginTop: 8,
                width: '100%',
              }}
            >
              <View
                style={{
                  width: `${Math.min(goalPct, 100)}%`,
                  height: '100%',
                  backgroundColor: '#F59E0B',
                }}
              />
            </View>
          </View>
        ) : (
          <View style={statCardBase(t)}>
            <View style={[statIconWrap, { backgroundColor: t.accentSoft }]}>
              <Icon name="arrow-up" size={18} color={t.accent} stroke={2.2} />
            </View>
            <Text style={[statLabel, { color: t.textSec }]}>{tStr(lang, 'netThisMonth')}</Text>
            <Text
              style={{
                fontSize: 20,
                fontWeight: '700',
                color: pctSaved > 0 ? t.income : t.textSec,
                letterSpacing: -0.4,
                marginTop: 2,
              }}
            >
              {pctSaved}%
            </Text>
            <Text style={{ fontSize: 11, color: t.textTer, marginTop: 1 }}>
              {tStr(lang, 'keptPct', { pct: pctSaved })}
            </Text>
          </View>
        )}

        {/* Bills */}
        <Pressable
          onPress={() => onNav('recurring')}
          style={({ pressed }) => [statCardBase(t), pressed && { opacity: 0.82, transform: [{ scale: 0.97 }] }]}
        >
          <View style={[statIconWrap, { backgroundColor: t.expenseSoft }]}>
            <Icon name="bell" size={18} color={t.expense} stroke={2.2} />
          </View>
          <Text style={[statLabel, { color: t.textSec }]}>{tStr(lang, 'upcomingBills')}</Text>
          <Text
            style={{
              fontSize: 20,
              fontWeight: '700',
              color: t.text,
              letterSpacing: -0.4,
              marginTop: 2,
            }}
          >
            {upcoming.length}
          </Text>
          {nextBillDays !== null ? (
            <Text style={{ fontSize: 11, color: t.textTer, marginTop: 1 }}>
              {nextBillDays === 0
                ? tStr(lang, 'billDueToday')
                : nextBillDays === 1
                ? tStr(lang, 'billNextOne')
                : tStr(lang, 'billNextDays', { days: nextBillDays })}
            </Text>
          ) : (
            <Text style={{ fontSize: 11, color: t.textTer, marginTop: 1 }}>
              {tStr(lang, 'noBillsDue')}
            </Text>
          )}
        </Pressable>
      </Reanimated.View>

      {/* ── Wallets carousel ── */}
      <Reanimated.View entering={FadeInDown.delay(270).duration(420).springify()}>
        <SectionHeader
          t={t}
          title={tStr(lang, 'myWallets')}
          action={tStr(lang, 'seeAll')}
          onAction={() => onNav('wallets')}
        />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20, gap: 10 }}
        >
          {s.wallets
            .filter((w) => !w.hidden)
            .map((w) => (
              <WalletCard key={w.id} w={w} lang={lang} currency={s.prefs.currency} t={t} />
            ))}
        </ScrollView>
      </Reanimated.View>

      {/* ── Recent activity ── */}
      <Reanimated.View entering={FadeInDown.delay(330).duration(420).springify()}>
        <SectionHeader
          t={t}
          title={tStr(lang, 'recentActivity')}
          action={tStr(lang, 'seeAll')}
          onAction={() => onNav('all-tx')}
        />
        <View style={{ paddingHorizontal: 20 }}>
          {recentTx.length === 0 ? (
            <Card t={t} style={{ paddingHorizontal: 16 }}>
              <EmptyState
                icon="wallet"
                title={tStr(lang, 'noTransactions')}
                subtitle={tStr(lang, 'noTransactionsSub')}
                t={t}
              />
            </Card>
          ) : (
            <Card t={t} style={{ paddingHorizontal: 16, paddingVertical: 4 }}>
              {recentTx.map((tx, i, arr) => (
                <TxRow
                  key={tx.id}
                  tx={tx}
                  t={t}
                  last={i === arr.length - 1}
                  onPress={() => onOpenTx(tx)}
                />
              ))}
            </Card>
          )}
        </View>
      </Reanimated.View>
        </ScrollView>
      </View>
    );
  }

  // Android: in-flow header inside the ScrollView, no glass, no changes.
  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 160 }}>
      <Reanimated.View entering={FadeInDown.delay(0).duration(400).springify()}>
        <View style={{ paddingTop: 20, paddingBottom: 4 }}>
          {headerContent}
        </View>
      </Reanimated.View>

      {/* ── Hero card ── */}
      <Reanimated.View entering={FadeInDown.delay(60).duration(420).springify()} style={{ paddingHorizontal: 20, paddingBottom: 14 }}>
        <HeroCard
          t={t}
          totalBalance={totalBalance}
          hideBalance={hideBalance}
          currency={s.prefs.currency}
          lang={lang}
          pctSaved={pctSaved}
          net={net}
          income={income}
          expense={expense}
          month={month}
          months={months}
          monthIdx={monthIdx}
          onSelectMonth={(i) => { setMonthIdx(i); setMonthPickerOpen(false); }}
          monthPickerOpen={monthPickerOpen}
          onTogglePicker={() => setMonthPickerOpen((v) => !v)}
          spark={spark}
        />
      </Reanimated.View>

      {/* ── Quick-add row ── */}
      <Reanimated.View
        entering={FadeInDown.delay(140).duration(420).springify()}
        style={{ paddingHorizontal: 20, paddingBottom: 20, flexDirection: 'row', gap: 10 }}
      >
        <QuickAction
          icon="arrow-down-left"
          label={tStr(lang, 'addIncome')}
          color={t.income}
          bg={t.incomeSoft}
          t={t}
          onPress={() => onAdd('income')}
        />
        <QuickAction
          icon="arrow-up-right"
          label={tStr(lang, 'addExpense')}
          color={t.expense}
          bg={t.expenseSoft}
          t={t}
          onPress={() => onAdd('expense')}
        />
        <QuickAction
          icon="users"
          label={tStr(lang, 'lend')}
          color={t.accent}
          bg={t.accentSoft}
          t={t}
          onPress={() => onAdd('debt')}
        />
      </Reanimated.View>

      {/* ── 2×2 Stat grid ── */}
      <Reanimated.View
        entering={FadeInDown.delay(200).duration(420).springify()}
        style={{ paddingHorizontal: 20, paddingBottom: 20, flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}
      >
        <Pressable
          onPress={() => onNav('all-tx')}
          style={({ pressed }) => [statCardBase(t), pressed && { opacity: 0.82, transform: [{ scale: 0.97 }] }]}
        >
          <View style={[statIconWrap, { backgroundColor: t.incomeSoft }]}>
            <Icon name="arrow-down-left" size={18} color={t.income} stroke={2.2} />
          </View>
          <Text style={[statLabel, { color: t.textSec }]}>{tStr(lang, 'income')}</Text>
          <BlurMoney value={fmtMoney(income, s.prefs.currency)} hidden={hideBalance} color={t.text} size={20} />
          {unitOf(s.prefs.currency) ? (
            <Text style={{ fontSize: 11, color: t.textTer, marginTop: 1 }}>{unitOf(s.prefs.currency)}</Text>
          ) : null}
        </Pressable>
        <Pressable
          onPress={() => onNav('all-tx')}
          style={({ pressed }) => [statCardBase(t), pressed && { opacity: 0.82, transform: [{ scale: 0.97 }] }]}
        >
          <View style={[statIconWrap, { backgroundColor: t.expenseSoft }]}>
            <Icon name="arrow-up-right" size={18} color={t.expense} stroke={2.2} />
          </View>
          <Text style={[statLabel, { color: t.textSec }]}>{tStr(lang, 'expenses')}</Text>
          <BlurMoney value={fmtMoney(expense, s.prefs.currency)} hidden={hideBalance} color={t.text} size={20} />
          {unitOf(s.prefs.currency) ? (
            <Text style={{ fontSize: 11, color: t.textTer, marginTop: 1 }}>{unitOf(s.prefs.currency)}</Text>
          ) : null}
        </Pressable>
        {s.goal ? (
          <View style={statCardBase(t)}>
            <View style={[statIconWrap, { backgroundColor: '#F59E0B22' }]}>
              <Icon name="trending-up" size={18} color="#F59E0B" stroke={2.2} />
            </View>
            <Text style={[statLabel, { color: t.textSec }]}>{tStr(lang, 'savingsGoal')}</Text>
            <Text style={{ fontSize: 20, fontWeight: '700', color: t.text, letterSpacing: -0.4, marginTop: 2 }}>
              {goalPct}%
            </Text>
            <View style={{ height: 4, borderRadius: 2, backgroundColor: t.surfaceAlt, overflow: 'hidden', marginTop: 8, width: '100%' }}>
              <View style={{ width: `${Math.min(goalPct, 100)}%`, height: '100%', backgroundColor: '#F59E0B' }} />
            </View>
          </View>
        ) : (
          <View style={statCardBase(t)}>
            <View style={[statIconWrap, { backgroundColor: t.accentSoft }]}>
              <Icon name="arrow-up" size={18} color={t.accent} stroke={2.2} />
            </View>
            <Text style={[statLabel, { color: t.textSec }]}>{tStr(lang, 'netThisMonth')}</Text>
            <Text style={{ fontSize: 20, fontWeight: '700', color: pctSaved > 0 ? t.income : t.textSec, letterSpacing: -0.4, marginTop: 2 }}>
              {pctSaved}%
            </Text>
            <Text style={{ fontSize: 11, color: t.textTer, marginTop: 1 }}>{tStr(lang, 'keptPct', { pct: pctSaved })}</Text>
          </View>
        )}
        <Pressable
          onPress={() => onNav('recurring')}
          style={({ pressed }) => [statCardBase(t), pressed && { opacity: 0.82, transform: [{ scale: 0.97 }] }]}
        >
          <View style={[statIconWrap, { backgroundColor: t.expenseSoft }]}>
            <Icon name="bell" size={18} color={t.expense} stroke={2.2} />
          </View>
          <Text style={[statLabel, { color: t.textSec }]}>{tStr(lang, 'upcomingBills')}</Text>
          <Text style={{ fontSize: 20, fontWeight: '700', color: t.text, letterSpacing: -0.4, marginTop: 2 }}>
            {upcoming.length}
          </Text>
          {nextBillDays !== null ? (
            <Text style={{ fontSize: 11, color: t.textTer, marginTop: 1 }}>
              {nextBillDays === 0 ? tStr(lang, 'billDueToday') : nextBillDays === 1 ? tStr(lang, 'billNextOne') : tStr(lang, 'billNextDays', { days: nextBillDays })}
            </Text>
          ) : (
            <Text style={{ fontSize: 11, color: t.textTer, marginTop: 1 }}>{tStr(lang, 'noBillsDue')}</Text>
          )}
        </Pressable>
      </Reanimated.View>

      {/* ── Wallets carousel ── */}
      <Reanimated.View entering={FadeInDown.delay(270).duration(420).springify()}>
        <SectionHeader t={t} title={tStr(lang, 'myWallets')} action={tStr(lang, 'seeAll')} onAction={() => onNav('wallets')} />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20, gap: 10 }}>
          {s.wallets.filter((w) => !w.hidden).map((w) => (
            <WalletCard key={w.id} w={w} lang={lang} currency={s.prefs.currency} t={t} />
          ))}
        </ScrollView>
      </Reanimated.View>

      {/* ── Recent activity ── */}
      <Reanimated.View entering={FadeInDown.delay(330).duration(420).springify()}>
        <SectionHeader t={t} title={tStr(lang, 'recentActivity')} action={tStr(lang, 'seeAll')} onAction={() => onNav('all-tx')} />
        <View style={{ paddingHorizontal: 20 }}>
          {recentTx.length === 0 ? (
            <Card t={t} style={{ paddingHorizontal: 16 }}>
              <EmptyState icon="wallet" title={tStr(lang, 'noTransactions')} subtitle={tStr(lang, 'noTransactionsSub')} t={t} />
            </Card>
          ) : (
            <Card t={t} style={{ paddingHorizontal: 16, paddingVertical: 4 }}>
              {recentTx.map((tx, i, arr) => (
                <TxRow key={tx.id} tx={tx} t={t} last={i === arr.length - 1} onPress={() => onOpenTx(tx)} />
              ))}
            </Card>
          )}
        </View>
      </Reanimated.View>
    </ScrollView>
  );
};

// ─── Hero Card ──────────────────────────────────────────────────────────────

type HeroCardProps = {
  t: Tokens;
  totalBalance: number;
  hideBalance: boolean;
  currency: Currency;
  lang: Lang;
  pctSaved: number;
  net: number;
  income: number;
  expense: number;
  month: { key: string; label: string };
  months: { key: string; label: string }[];
  monthIdx: number;
  onSelectMonth: (i: number) => void;
  monthPickerOpen: boolean;
  onTogglePicker: () => void;
  spark: number[];
};

const HeroCard = memo(function HeroCard({
  t,
  totalBalance,
  hideBalance,
  currency,
  lang,
  pctSaved,
  net,
  income,
  expense,
  month,
  months,
  monthIdx,
  onSelectMonth,
  monthPickerOpen,
  onTogglePicker,
  spark,
}: HeroCardProps) {
  const accentDark = t.dark ? '#0a7a5a' : '#036b4a';

  return (
    <View>
      {/* Main hero card — accent bg with decorative circles for depth */}
      <View
        style={{
          borderRadius: 24,
          backgroundColor: t.accent,
          overflow: 'hidden',
          padding: 24,
          shadowColor: t.accent,
          shadowOpacity: t.dark ? 0.4 : 0.3,
          shadowRadius: 20,
          shadowOffset: { width: 0, height: 8 },
          elevation: 8,
        }}
      >
        {/* Decorative depth circles (no gradient dep) */}
        <View
          style={{
            position: 'absolute',
            top: -50,
            right: -50,
            width: 180,
            height: 180,
            borderRadius: 90,
            backgroundColor: accentDark,
            opacity: 0.45,
          }}
        />
        <View
          style={{
            position: 'absolute',
            bottom: -30,
            left: -30,
            width: 120,
            height: 120,
            borderRadius: 60,
            backgroundColor: accentDark,
            opacity: 0.25,
          }}
        />

        {/* Row: label + month picker */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 12,
          }}
        >
          <Text
            style={{
              fontSize: 12,
              fontWeight: '600',
              color: 'rgba(255,255,255,0.75)',
              letterSpacing: 0.8,
              textTransform: 'uppercase',
            }}
          >
            {tStr(lang, 'totalBalance')}
          </Text>

          {/* Month picker pill */}
          <Pressable
            onPress={onTogglePicker}
            style={({ pressed }) => ({
              flexDirection: 'row',
              alignItems: 'center',
              gap: 4,
              paddingVertical: 5,
              paddingHorizontal: 11,
              borderRadius: 100,
              backgroundColor: 'rgba(255,255,255,0.18)',
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <Text style={{ fontSize: 13, fontWeight: '600', color: '#fff' }}>{month.label}</Text>
            <Icon name="chevron-down" size={13} color="#fff" stroke={2.5} />
          </Pressable>
        </View>

        {/* Balance amount */}
        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6, marginBottom: 4 }}>
          <BlurMoney
            value={fmtMoney(totalBalance, currency)}
            hidden={hideBalance}
            color="#fff"
            size={38}
          />
          {!hideBalance && unitOf(currency) ? (
            <Text style={{ fontSize: 15, color: 'rgba(255,255,255,0.65)', fontWeight: '500' }}>
              {unitOf(currency)}
            </Text>
          ) : null}
        </View>

        {/* Net sub-stat */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 18 }}>
          <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>
            {tStr(lang, 'netThisMonth')}
          </Text>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 3,
              paddingVertical: 2,
              paddingHorizontal: 7,
              borderRadius: 6,
              backgroundColor: net >= 0 ? 'rgba(255,255,255,0.2)' : 'rgba(239,68,68,0.35)',
            }}
          >
            {pctSaved > 0 ? (
              <Icon name="arrow-up" size={10} color="#fff" stroke={2.5} />
            ) : null}
            <Text style={{ fontSize: 12, fontWeight: '700', color: '#fff' }}>
              {hideBalance ? '*****' : fmtMoney(net, currency)}
            </Text>
          </View>
        </View>

        {/* Income / Expense mini row */}
        <View
          style={{
            flexDirection: 'row',
            gap: 10,
            marginBottom: 18,
          }}
        >
          <HeroMiniStat
            icon="arrow-down-left"
            label={tStr(lang, 'income')}
            value={fmtMoney(income, currency)}
            hidden={hideBalance}
          />
          <HeroMiniStat
            icon="arrow-up-right"
            label={tStr(lang, 'expenses')}
            value={fmtMoney(expense, currency)}
            hidden={hideBalance}
          />
        </View>

        {/* Sparkline embedded in hero — 14-day expense trend */}
        <View style={{ opacity: 0.6 }}>
          <Sparkline data={spark} color="#fff" height={36} />
        </View>

        {/* Income/expense ratio bar */}
        <View
          style={{
            height: 4,
            borderRadius: 2,
            backgroundColor: 'rgba(255,255,255,0.2)',
            overflow: 'hidden',
            marginTop: 10,
          }}
        >
          <View
            style={{
              width: `${income + expense > 0 ? (income / (income + expense)) * 100 : 50}%`,
              height: '100%',
              backgroundColor: 'rgba(255,255,255,0.75)',
            }}
          />
        </View>
      </View>

      {/* Month picker dropdown */}
      {monthPickerOpen ? (
        <View
          style={{
            position: 'absolute',
            top: 54,
            right: 0,
            backgroundColor: t.sheetBg,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: t.border,
            shadowColor: '#000',
            shadowOpacity: t.dark ? 0.4 : 0.15,
            shadowRadius: 16,
            shadowOffset: { width: 0, height: 6 },
            elevation: 12,
            zIndex: 100,
            minWidth: 120,
            overflow: 'hidden',
          }}
        >
          {months.map((m, i) => {
            const on = i === monthIdx;
            return (
              <Pressable
                key={m.key}
                onPress={() => onSelectMonth(i)}
                style={({ pressed }) => ({
                  paddingVertical: 13,
                  paddingHorizontal: 18,
                  backgroundColor: on
                    ? t.accentSoft
                    : pressed
                    ? t.surfaceAlt
                    : 'transparent',
                  borderBottomWidth: i < months.length - 1 ? 1 : 0,
                  borderBottomColor: t.divider,
                })}
              >
                <Text
                  style={{
                    fontSize: 15,
                    fontWeight: on ? '700' : '500',
                    color: on ? t.accent : t.text,
                  }}
                >
                  {m.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      ) : null}
    </View>
  );
});

// ─── Hero mini stat (inside colored card) ────────────────────────────────────

const HeroMiniStat: React.FC<{
  icon: IconName;
  label: string;
  value: string;
  hidden: boolean;
}> = ({ icon, label, value, hidden }) => (
  <View
    style={{
      flex: 1,
      backgroundColor: 'rgba(255,255,255,0.14)',
      borderRadius: 14,
      padding: 12,
    }}
  >
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 5 }}>
      <Icon name={icon} size={13} color="rgba(255,255,255,0.8)" stroke={2.2} />
      <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', fontWeight: '600' }}>
        {label}
      </Text>
    </View>
    <Text
      style={{
        fontSize: 15,
        fontWeight: '700',
        color: '#fff',
        letterSpacing: -0.3,
      }}
    >
      {hidden ? '*****' : value}
    </Text>
  </View>
);

// ─── BlurMoney (hides digits) ────────────────────────────────────────────────

const HIDDEN_MASK = '*****';

const BlurMoney: React.FC<{
  value: string;
  hidden: boolean;
  color: string;
  size?: number;
}> = ({ value, hidden, color, size = 38 }) => {
  const base = {
    fontSize: size,
    fontWeight: '700' as const,
    letterSpacing: -1.4,
    lineHeight: size * 1.2,
    color,
  };
  if (hidden) {
    return (
      <Text style={{ ...base, fontSize: size * 0.92, letterSpacing: 3 }}>{HIDDEN_MASK}</Text>
    );
  }
  return <Text style={base}>{value}</Text>;
};

// ─── Wallet card (carousel item) ─────────────────────────────────────────────

const WalletCard = memo(function WalletCard({
  w,
  lang,
  currency,
  t,
}: {
  w: Wallet;
  lang: Lang;
  currency: Currency;
  t: Tokens;
}) {
  return (
    <Pressable
      style={({ pressed }) => ({
        width: 155,
        padding: 15,
        borderRadius: 18,
        backgroundColor: t.surface,
        borderWidth: 1,
        borderColor: t.border,
        shadowColor: '#000',
        shadowOpacity: t.dark ? 0.18 : 0.06,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 3 },
        elevation: 3,
        opacity: pressed ? 0.85 : 1,
        transform: [{ scale: pressed ? 0.97 : 1 }],
      })}
    >
      <View
        style={{
          width: 34,
          height: 34,
          borderRadius: 10,
          backgroundColor: w.color + '22',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 10,
        }}
      >
        <Icon name={w.icon as IconName} size={17} color={w.color} />
      </View>
      <Text style={{ fontSize: 12, color: t.textSec, fontWeight: '500', marginBottom: 2 }}>
        {walletName(w, lang)}
      </Text>
      <Text style={{ fontSize: 16, fontWeight: '700', color: t.text, letterSpacing: -0.4 }}>
        {fmtMoney(w.balance, currency)}
      </Text>
    </Pressable>
  );
});

// ─── Quick-action button ──────────────────────────────────────────────────────

const QuickAction: React.FC<{
  icon: IconName;
  label: string;
  color: string;
  bg: string;
  t: Tokens;
  onPress: () => void;
}> = ({ icon, label, color, bg, t, onPress }) => (
  <Pressable
    onPress={onPress}
    style={({ pressed }) => [
      {
        flex: 1,
        paddingVertical: 15,
        paddingHorizontal: 10,
        borderRadius: 18,
        backgroundColor: t.surface,
        borderWidth: 1,
        borderColor: t.border,
        alignItems: 'center',
        gap: 8,
        shadowColor: '#000',
        shadowOpacity: t.dark ? 0.15 : 0.05,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 2 },
        elevation: 2,
      },
      pressed && { transform: [{ scale: 0.96 }], opacity: 0.9 },
    ]}
  >
    <View
      style={{
        width: 38,
        height: 38,
        borderRadius: 19,
        backgroundColor: bg,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Icon name={icon} size={19} color={color} stroke={2.2} />
    </View>
    <Text style={{ fontSize: 12.5, fontWeight: '600', color: t.text }}>{label}</Text>
  </Pressable>
);

// ─── Stat card helpers ────────────────────────────────────────────────────────

const statCardBase = (t: Tokens) =>
  ({
    width: '48%' as unknown as number,
    flexGrow: 1,
    padding: 16,
    borderRadius: 18,
    backgroundColor: t.surface,
    borderWidth: 1,
    borderColor: t.border,
    shadowColor: '#000',
    shadowOpacity: t.dark ? 0.15 : 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  } as const);

const statIconWrap = {
  width: 34,
  height: 34,
  borderRadius: 10,
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
  marginBottom: 10,
};

const statLabel = {
  fontSize: 11.5,
  fontWeight: '600' as const,
  textTransform: 'uppercase' as const,
  letterSpacing: 0.4,
  marginBottom: 2,
};
