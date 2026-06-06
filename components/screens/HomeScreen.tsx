import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { fmtMoney, isoDate, last6Months, today, unitOf, type Currency } from '../../lib/format';
import { tStr } from '../../lib/i18n';
import { actions, selectMonth, useStore, walletName, type Transaction } from '../../lib/store';
import type { Tokens } from '../../lib/tokens';
import { Icon, type IconName } from '../Icon';
import { Sparkline } from '../Sparkline';
import { Card, CatIcon, EmptyState, IconButton, MoneyText, SectionHeader, TxRow } from '../ui';

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
  const [variant, setVariant] = useState<'net' | 'balance'>('net');

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

  const heroCard = () => {
    if (variant === 'balance') {
      return (
        <Card t={t} style={{ padding: 24, overflow: 'hidden' }}>
          <View
            style={{
              position: 'absolute',
              top: -40,
              right: -40,
              width: 160,
              height: 160,
              borderRadius: 80,
              backgroundColor: t.accentSoft,
            }}
          />
          <Text
            style={{
              fontSize: 12.5,
              color: t.textSec,
              fontWeight: '600',
              letterSpacing: 0.4,
              marginBottom: 8,
            }}
          >
            TOTAL BALANCE
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8, marginBottom: 6 }}>
            <BlurMoney
              value={fmtMoney(totalBalance, s.prefs.currency)}
              hidden={hideBalance}
              color={t.text}
            />
            {!hideBalance && unitOf(s.prefs.currency) ? (
              <Text style={{ fontSize: 14, color: t.textSec, fontWeight: '500' }}>
                {unitOf(s.prefs.currency)}
              </Text>
            ) : null}
          </View>
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 14 }}>
            {s.wallets
              .filter((w) => !w.hidden)
              .map((w) => (
                <View
                  key={w.id}
                  style={{
                    flex: 1,
                    padding: 10,
                    borderRadius: 12,
                    backgroundColor: w.color + '14',
                    borderWidth: 1,
                    borderColor: w.color + '22',
                  }}
                >
                  <View
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}
                  >
                    <Icon name={w.icon as IconName} size={13} color={w.color} />
                    <Text style={{ fontSize: 10.5, color: t.textSec, fontWeight: '600' }}>
                      {walletName(w, lang)}
                    </Text>
                  </View>
                  <Text style={{ fontSize: 13, fontWeight: '700', color: t.text }}>
                    {fmtMoney(w.balance, s.prefs.currency)}
                  </Text>
                </View>
              ))}
          </View>
        </Card>
      );
    }
    return (
      <Card t={t} style={{ padding: 24, overflow: 'hidden' }}>
        <View
          style={{
            position: 'absolute',
            top: -40,
            right: -40,
            width: 160,
            height: 160,
            borderRadius: 80,
            backgroundColor: t.accentSoft,
          }}
        />
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <Text
            style={{
              fontSize: 12.5,
              color: t.textSec,
              fontWeight: '600',
              letterSpacing: 0.4,
            }}
          >
            {tStr(lang, 'netThisMonth')}
          </Text>
          {pctSaved > 0 ? (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 3,
                paddingVertical: 2,
                paddingHorizontal: 7,
                borderRadius: 6,
                backgroundColor: t.incomeSoft,
              }}
            >
              <Icon name="arrow-up" size={10} color={t.income} stroke={2.5} />
              <Text style={{ color: t.income, fontSize: 11, fontWeight: '600' }}>{pctSaved}%</Text>
            </View>
          ) : null}
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8, marginBottom: 4 }}>
          <BlurMoney value={fmtMoney(net, s.prefs.currency)} hidden={hideBalance} color={t.text} />
          {!hideBalance && unitOf(s.prefs.currency) ? (
            <Text style={{ fontSize: 14, color: t.textSec, fontWeight: '500' }}>
              {unitOf(s.prefs.currency)}
            </Text>
          ) : null}
        </View>
        <Text style={{ fontSize: 13, color: t.textSec }}>
          {tStr(lang, 'keptPct', { pct: pctSaved })}
        </Text>

        <View style={{ flexDirection: 'row', gap: 12, marginTop: 22 }}>
          <MiniStat label={tStr(lang, 'income')} amount={income} kind="income" t={t} currency={s.prefs.currency} />
          <MiniStat label={tStr(lang, 'expenses')} amount={expense} kind="expense" t={t} currency={s.prefs.currency} />
        </View>

        <View style={{ marginTop: 18 }}>
          <View
            style={{
              height: 8,
              borderRadius: 4,
              backgroundColor: t.expenseSoft,
              overflow: 'hidden',
              flexDirection: 'row',
            }}
          >
            <View
              style={{
                width: `${income + expense > 0 ? (income / (income + expense)) * 100 : 50}%`,
                backgroundColor: t.income,
                height: '100%',
              }}
            />
          </View>
        </View>
      </Card>
    );
  };

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 160 }}>
      <View
        style={{
          paddingTop: 20,
          paddingHorizontal: 20,
          paddingBottom: 14,
          flexDirection: 'row',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
        }}
      >
        <View>
          <Text style={{ fontSize: 13, color: t.textSec, fontWeight: '500', marginBottom: 4 }}>
            {greeting},
          </Text>
          <Text
            style={{
              fontSize: 26,
              fontWeight: '700',
              color: t.text,
              letterSpacing: -0.6,
            }}
          >
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
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 16, gap: 8 }}
      >
        {months.map((m, i) => {
          const on = i === monthIdx;
          return (
            <Pressable
              key={m.key}
              onPress={() => setMonthIdx(i)}
              style={{
                paddingVertical: 6,
                paddingHorizontal: 14,
                borderRadius: 100,
                backgroundColor: on ? t.text : t.surface,
                borderWidth: 1,
                borderColor: on ? t.text : t.border,
              }}
            >
              <Text
                style={{
                  color: on ? t.surface : t.textSec,
                  fontSize: 13,
                  fontWeight: '600',
                }}
              >
                {m.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={{ paddingHorizontal: 20, paddingBottom: 12 }}>{heroCard()}</View>

      <View
        style={{
          paddingHorizontal: 20,
          paddingBottom: 16,
          flexDirection: 'row',
          justifyContent: 'center',
          gap: 6,
        }}
      >
        {(
          [
            { k: 'net', l: 'Month' },
            { k: 'balance', l: 'Balance' },
          ] as const
        ).map((v) => (
          <Pressable
            key={v.k}
            onPress={() => setVariant(v.k)}
            style={{
              paddingVertical: 4,
              paddingHorizontal: 10,
              borderRadius: 6,
              backgroundColor: variant === v.k ? t.accentSoft : 'transparent',
            }}
          >
            <Text
              style={{
                color: variant === v.k ? t.accent : t.textTer,
                fontSize: 11,
                fontWeight: '600',
              }}
            >
              {v.l}
            </Text>
          </Pressable>
        ))}
      </View>

      <View style={{ paddingHorizontal: 20, paddingBottom: 20, flexDirection: 'row', gap: 10 }}>
        <QuickAction
          icon="arrow-down-left"
          label={tStr(lang, 'addIncome')}
          color={t.income}
          t={t}
          onPress={() => onAdd('income')}
        />
        <QuickAction
          icon="arrow-up-right"
          label={tStr(lang, 'addExpense')}
          color={t.expense}
          t={t}
          onPress={() => onAdd('expense')}
        />
        <QuickAction
          icon="users"
          label={tStr(lang, 'lend')}
          color={t.accent}
          t={t}
          onPress={() => onAdd('debt')}
        />
      </View>

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
            <Pressable
              key={w.id}
              onPress={() => onNav('wallets')}
              style={{
                width: 150,
                padding: 14,
                borderRadius: 16,
                backgroundColor: t.surface,
                borderWidth: 1,
                borderColor: t.border,
              }}
            >
              <View
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 10,
                  backgroundColor: w.color + '20',
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
              <Text style={{ fontSize: 15, fontWeight: '700', color: t.text, letterSpacing: -0.3 }}>
                {fmtMoney(w.balance, s.prefs.currency)}
              </Text>
            </Pressable>
          ))}
      </ScrollView>

      {s.goal ? (
        <>
          <SectionHeader t={t} title={tStr(lang, 'savingsGoal')} />
          <View style={{ paddingHorizontal: 20, paddingBottom: 20 }}>
            <Card t={t} style={{ padding: 18 }}>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 12,
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <View
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 18,
                      backgroundColor: '#F59E0B22',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Icon name="trending-up" size={18} color="#F59E0B" />
                  </View>
                  <View>
                    <Text style={{ fontSize: 14, fontWeight: '600', color: t.text }}>
                      {s.goal.title[lang] || s.goal.title.en}
                    </Text>
                    <Text style={{ fontSize: 12, color: t.textSec, marginTop: 1 }}>
                      {fmtMoney(s.goal.saved, s.prefs.currency)} /{' '}
                      {fmtMoney(s.goal.target, s.prefs.currency)}
                    </Text>
                  </View>
                </View>
                <Text style={{ fontSize: 15, fontWeight: '700', color: t.text }}>
                  {Math.round((s.goal.saved / s.goal.target) * 100)}%
                </Text>
              </View>
              <View
                style={{
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: t.surfaceAlt,
                  overflow: 'hidden',
                }}
              >
                <View
                  style={{
                    width: `${(s.goal.saved / s.goal.target) * 100}%`,
                    height: '100%',
                    backgroundColor: '#F59E0B',
                  }}
                />
              </View>
            </Card>
          </View>
        </>
      ) : null}

      <SectionHeader t={t} title={tStr(lang, 'daily')} />
      <View style={{ paddingHorizontal: 20, paddingBottom: 20 }}>
        <Card t={t} style={{ padding: 16 }}>
          <Sparkline data={spark} color={t.expense} />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
            <Text style={{ fontSize: 11, color: t.textTer }}>14 days ago</Text>
            <Text style={{ fontSize: 11, color: t.textTer }}>Today</Text>
          </View>
        </Card>
      </View>

      {upcoming.length > 0 ? (
        <>
          <SectionHeader
            t={t}
            title={tStr(lang, 'upcomingBills')}
            action={tStr(lang, 'seeAll')}
            onAction={() => onNav('recurring')}
          />
          <View style={{ paddingHorizontal: 20, paddingBottom: 20, gap: 8 }}>
            {upcoming.map((r) => {
              const d = new Date(r.nextDate);
              const tdy = today();
              const days = Math.round((d.getTime() - tdy.getTime()) / 86_400_000);
              return (
                <Card
                  key={r.id}
                  t={t}
                  style={{ padding: 12, flexDirection: 'row', alignItems: 'center', gap: 12 }}
                >
                  <CatIcon cat={r.cat} size={34} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 14, fontWeight: '500', color: t.text }}>{r.note}</Text>
                    <Text style={{ fontSize: 11.5, color: t.textSec, marginTop: 1 }}>
                      In {days} {days === 1 ? 'day' : 'days'}
                    </Text>
                  </View>
                  <MoneyText amount={r.amount} kind={r.kind} t={t} size={14} />
                </Card>
              );
            })}
          </View>
        </>
      ) : null}

      <SectionHeader
        t={t}
        title={tStr(lang, 'recentActivity')}
        action={tStr(lang, 'seeAll')}
        onAction={() => onNav('all-tx')}
      />
      <View style={{ paddingHorizontal: 20 }}>
        {monthData.tx.length === 0 ? (
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
            {monthData.tx.slice(0, 6).map((tx, i, arr) => (
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
    </ScrollView>
  );
};

const HIDDEN_MASK = '✵✵✵✵✵';

const BlurMoney: React.FC<{ value: string; hidden: boolean; color: string }> = ({
  value,
  hidden,
  color,
}) => {
  const base = {
    fontSize: 38,
    fontWeight: '700' as const,
    letterSpacing: -1.4,
    lineHeight: 46,
    color,
  };
  if (hidden) {
    return (
      <Text style={{ ...base, fontSize: 20, letterSpacing: 2 }}>
        {HIDDEN_MASK}
      </Text>
    );
  }
  return <Text style={base}>{value}</Text>;
};

const MiniStat: React.FC<{
  label: string;
  amount: number;
  kind: 'income' | 'expense';
  t: Tokens;
  currency: Currency;
}> = ({ label, amount, kind, t, currency }) => {
  const up = kind === 'income';
  const color = up ? t.income : t.expense;
  return (
    <View style={{ flex: 1 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
        <View
          style={{
            width: 18,
            height: 18,
            borderRadius: 9,
            backgroundColor: up ? t.incomeSoft : t.expenseSoft,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon
            name={up ? 'arrow-down-left' : 'arrow-up-right'}
            size={11}
            color={color}
            stroke={2.5}
          />
        </View>
        <Text style={{ fontSize: 12.5, color: t.textSec, fontWeight: '500' }}>{label}</Text>
      </View>
      <Text style={{ fontSize: 17, fontWeight: '600', color: t.text, letterSpacing: -0.3 }}>
        {fmtMoney(amount, currency)}
      </Text>
    </View>
  );
};

const QuickAction: React.FC<{
  icon: IconName;
  label: string;
  color: string;
  t: Tokens;
  onPress: () => void;
}> = ({ icon, label, color, t, onPress }) => (
  <Pressable
    onPress={onPress}
    style={({ pressed }) => [
      {
        flex: 1,
        paddingVertical: 14,
        paddingHorizontal: 10,
        borderRadius: 16,
        backgroundColor: t.surface,
        borderWidth: 1,
        borderColor: t.border,
        alignItems: 'center',
        gap: 8,
      },
      pressed && { transform: [{ scale: 0.97 }] },
    ]}
  >
    <View
      style={{
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: color + '22',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Icon name={icon} size={18} color={color} stroke={2.2} />
    </View>
    <Text style={{ fontSize: 12.5, fontWeight: '600', color: t.text }}>{label}</Text>
  </Pressable>
);
