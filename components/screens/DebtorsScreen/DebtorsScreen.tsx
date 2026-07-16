import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { Tokens } from '@/lib/tokens';
import { AppTextInput } from '@/components/AppTextInput';
import { Card, EmptyState } from '@/components/ui';
import { Icon } from '@/components/Icon';
import { fmtDate, fmtMoney, today, type Currency, unitOf } from '@/lib/format';
import { tStr, type Lang } from '@/lib/i18n';
import { type Debt, useStore } from '@/lib/store';

type Props = {
  t: Tokens;
  onOpen: (d: Debt) => void;
};

type Filter = 'all' | 'owe_me' | 'i_owe' | 'overdue' | 'due';

export const DebtorsScreen = ({ t, onOpen, contentTopPad = 0 }: Props & { contentTopPad?: number }) => {
  const s = useStore();
  const lang = s.prefs.lang;
  const [q, setQ] = useState<string>('');
  const [filter, setFilter] = useState<Filter>('all');

  const tdyMs = useMemo(() => today().getTime(), []);

  const { active, oweMeTotal, iOweTotal, net, overdueIds, dueIds, overdueCount, dueCount } =
    useMemo(() => {
      const active = s.debts.filter((d) => !d.archived);
      const oweMeTotal = active
        .filter((d) => d.direction === 'owe_me')
        .reduce((a, d) => a + (d.amount - d.paid), 0);
      const iOweTotal = active
        .filter((d) => d.direction === 'i_owe')
        .reduce((a, d) => a + (d.amount - d.paid), 0);
      const net = oweMeTotal - iOweTotal;
      const overdueIds = new Set<string>();
      const dueIds = new Set<string>();
      active.forEach((d) => {
        const dueMs = new Date(d.due).getTime();
        if (d.paid >= d.amount) return;
        if (dueMs < tdyMs) overdueIds.add(d.id);
        else if (dueMs - tdyMs < 7 * 86_400_000) dueIds.add(d.id);
      });
      return {
        active,
        oweMeTotal,
        iOweTotal,
        net,
        overdueIds,
        dueIds,
        overdueCount: overdueIds.size,
        dueCount: dueIds.size,
      };
    }, [s.debts, tdyMs]);

  const filtered = useMemo(() => {
    return active.filter((d) => {
      if (q && !d.name.toLowerCase().includes(q.toLowerCase())) return false;
      if (filter === 'owe_me' && d.direction !== 'owe_me') return false;
      if (filter === 'i_owe' && d.direction !== 'i_owe') return false;
      if (filter === 'overdue' && !overdueIds.has(d.id)) return false;
      if (filter === 'due' && !dueIds.has(d.id)) return false;
      return true;
    });
  }, [active, q, filter, overdueIds, dueIds]);

  const filters: { k: Filter; l: string; n?: number }[] = [
    { k: 'all', l: tStr(lang, 'allFilter'), n: active.length },
    { k: 'owe_me', l: tStr(lang, 'oweMe') },
    { k: 'i_owe', l: tStr(lang, 'iOwe') },
    { k: 'overdue', l: tStr(lang, 'overdue'), n: overdueCount },
    { k: 'due', l: tStr(lang, 'dueThisWeek'), n: dueCount },
  ];

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 160, paddingTop: contentTopPad }}>
      <View style={{ paddingHorizontal: 20, paddingBottom: 16 }}>
        <Card t={t} style={{ padding: 0, overflow: 'hidden' }}>
          <View style={{ flexDirection: 'row' }}>
            <BalanceCol
              t={t}
              label={tStr(lang, 'oweMe')}
              amount={oweMeTotal}
              currency={s.prefs.currency}
              tone="income"
              icon="arrow-down-left"
              count={active.filter((d) => d.direction === 'owe_me').length}
              countLabel={tStr(lang, 'active')}
              onPress={() => setFilter(filter === 'owe_me' ? 'all' : 'owe_me')}
              active={filter === 'owe_me'}
            />
            <View style={{ width: StyleSheet.hairlineWidth, backgroundColor: t.border }} />
            <BalanceCol
              t={t}
              label={tStr(lang, 'iOwe')}
              amount={iOweTotal}
              currency={s.prefs.currency}
              tone="expense"
              icon="arrow-up-right"
              count={active.filter((d) => d.direction === 'i_owe').length}
              countLabel={tStr(lang, 'active')}
              onPress={() => setFilter(filter === 'i_owe' ? 'all' : 'i_owe')}
              active={filter === 'i_owe'}
            />
          </View>
          <View
            style={{
              borderTopWidth: StyleSheet.hairlineWidth,
              borderTopColor: t.border,
              paddingVertical: 12,
              paddingHorizontal: 16,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: t.surfaceAlt,
            }}
          >
            <Text style={{ fontSize: 12, fontWeight: '600', color: t.textSec, letterSpacing: 0.4 }}>
              {tStr(lang, 'netBalance').toUpperCase()}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4 }}>
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: '700',
                  color: net === 0 ? t.text : net > 0 ? t.income : t.expense,
                  letterSpacing: -0.3,
                }}
              >
                {net > 0 ? '+' : net < 0 ? '−' : ''}
                {fmtMoney(Math.abs(net), s.prefs.currency)}
              </Text>
              {unitOf(s.prefs.currency) ? (
                <Text style={{ fontSize: 11, color: t.textSec, fontWeight: '500' }}>
                  {unitOf(s.prefs.currency)}
                </Text>
              ) : null}
            </View>
          </View>
        </Card>
      </View>

      <View style={{ paddingHorizontal: 20, paddingBottom: 10 }}>
        <View style={{ position: 'relative' }}>
          <View
            pointerEvents="none"
            style={{
              position: 'absolute',
              left: 14,
              top: 0,
              bottom: 0,
              justifyContent: 'center',
              zIndex: 1,
            }}
          >
            <Icon name="search" size={18} color={t.textSec} stroke={2} />
          </View>
          <AppTextInput
            value={q}
            onChangeText={setQ}
            placeholder={tStr(lang, 'searchByName')}
            placeholderTextColor={t.textTer}
            style={{
              paddingVertical: 12,
              paddingLeft: 42,
              paddingRight: 14,
              borderRadius: 12,
              backgroundColor: t.surface,
              borderWidth: StyleSheet.hairlineWidth,
              borderColor: t.border,
              color: t.text,
              fontSize: 14,
            }}
          />
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 12, gap: 6 }}
      >
        {filters.map(({ k, l, n }) => {
          const on = filter === k;
          return (
            <Pressable
              key={k}
              onPress={() => setFilter(k)}
              style={{
                paddingVertical: 7,
                paddingHorizontal: 12,
                borderRadius: 100,
                backgroundColor: on ? t.text : t.surface,
                borderWidth: 1,
                borderColor: on ? t.text : t.border,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <Text
                style={{
                  color: on ? t.surface : t.text,
                  fontSize: 12.5,
                  fontWeight: '500',
                }}
              >
                {l}
              </Text>
              {n !== undefined && n > 0 ? (
                <View
                  style={{
                    minWidth: 18,
                    height: 18,
                    paddingHorizontal: 5,
                    borderRadius: 9,
                    backgroundColor: on ? 'rgba(255,255,255,0.18)' : t.surfaceAlt,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text
                    style={{
                      color: on ? t.surface : t.textSec,
                      fontSize: 10.5,
                      fontWeight: '700',
                    }}
                  >
                    {n}
                  </Text>
                </View>
              ) : null}
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={{ paddingHorizontal: 20, gap: 8 }}>
        {filtered.length === 0 ? (
          <Card t={t}>
            <EmptyState
              icon="users"
              title={tStr(lang, 'noDebtors')}
              subtitle={tStr(lang, 'noDebtorsSub')}
              t={t}
            />
          </Card>
        ) : (
          filtered.map((d) => (
            <DebtorCard
              key={d.id}
              debtor={d}
              t={t}
              currency={s.prefs.currency}
              lang={lang}
              onPress={() => onOpen(d)}
            />
          ))
        )}
      </View>
    </ScrollView>
  );
};

const BalanceCol = ({ t, label, amount, currency, tone, icon, count, countLabel, onPress, active }: { t: Tokens; label: string; amount: number; currency: Currency; tone: 'income' | 'expense'; icon: 'arrow-down-left' | 'arrow-up-right'; count: number; countLabel: string; onPress: () => void; active: boolean }) => {
  const color = tone === 'income' ? t.income : t.expense;
  const soft = tone === 'income' ? t.incomeSoft : t.expenseSoft;
  return (
    <Pressable
      onPress={onPress}
      style={{
        flex: 1,
        padding: 16,
        backgroundColor: active ? soft : 'transparent',
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <View
          style={{
            width: 26,
            height: 26,
            borderRadius: 13,
            backgroundColor: soft,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon name={icon} size={14} color={color} stroke={2.5} />
        </View>
        <Text
          numberOfLines={1}
          style={{ fontSize: 12, fontWeight: '600', color: t.textSec, flex: 1 }}
        >
          {label}
        </Text>
      </View>
      <Text
        numberOfLines={1}
        adjustsFontSizeToFit
        style={{
          fontSize: 22,
          fontWeight: '700',
          color: t.text,
          letterSpacing: -0.6,
        }}
      >
        {fmtMoney(amount, currency)}
      </Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 4 }}>
        <View
          style={{
            width: 6,
            height: 6,
            borderRadius: 3,
            backgroundColor: color,
          }}
        />
        <Text style={{ fontSize: 11, color: t.textSec, fontWeight: '500' }}>
          {count} {countLabel.toLowerCase()}
        </Text>
      </View>
    </Pressable>
  );
};

const DebtorCard = ({ debtor, t, currency, lang, onPress }: { debtor: Debt; t: Tokens; currency: Currency; lang: Lang; onPress: () => void }) => {
  const overdue = new Date(debtor.due).getTime() < today().getTime() && debtor.paid < debtor.amount;
  const remaining = debtor.amount - debtor.paid;
  const isOweMe = debtor.direction === 'owe_me';
  const dirColor = isOweMe ? t.income : t.expense;
  const dirSoft = isOweMe ? t.incomeSoft : t.expenseSoft;
  const initials = debtor.name
    .split(' ')
    .map((x) => x[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
  return (
    <Pressable
      onPress={onPress}
      style={{
        borderRadius: 16,
        backgroundColor: t.surface,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: t.border,
        flexDirection: 'row',
        alignItems: 'stretch',
        overflow: 'hidden',
      }}
    >
      <View style={{ width: 3, backgroundColor: dirColor }} />
      <View
        style={{
          flex: 1,
          padding: 14,
          paddingLeft: 13,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <View
          style={{
            width: 42,
            height: 42,
            borderRadius: 21,
            backgroundColor: debtor.color + '22',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ fontSize: 14, fontWeight: '700', color: debtor.color }}>{initials}</Text>
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text
              numberOfLines={1}
              style={{ fontSize: 14.5, fontWeight: '600', color: t.text, flexShrink: 1 }}
            >
              {debtor.name}
            </Text>
            {overdue ? (
              <View
                style={{
                  paddingVertical: 2,
                  paddingHorizontal: 5,
                  borderRadius: 3,
                  backgroundColor: t.expenseSoft,
                }}
              >
                <Text
                  style={{
                    fontSize: 9.5,
                    fontWeight: '700',
                    color: t.expense,
                    textTransform: 'uppercase',
                    letterSpacing: 0.3,
                  }}
                >
                  {tStr(lang, 'overdue')}
                </Text>
              </View>
            ) : null}
          </View>
          {debtor.note ? (
            <Text numberOfLines={1} style={{ fontSize: 12, color: t.textSec, marginTop: 2 }}>
              {debtor.note}
            </Text>
          ) : null}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 1 }}>
            <Icon name="calendar" size={10} color={t.textTer} stroke={2} />
            <Text style={{ fontSize: 11, color: t.textTer }}>
              {fmtDate(debtor.due, lang)}
              {debtor.dueTime ? ` · ${debtor.dueTime}` : ''}
            </Text>
            {debtor.paid > 0 ? (
              <Text style={{ fontSize: 11, color: t.income, marginLeft: 6 }}>
                {'· '}{fmtMoney(debtor.paid, currency)} {tStr(lang, 'paid').toLowerCase()}
              </Text>
            ) : null}
          </View>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <View
            style={{
              paddingVertical: 2,
              paddingHorizontal: 6,
              borderRadius: 4,
              backgroundColor: dirSoft,
              marginBottom: 4,
            }}
          >
            <Text
              style={{
                fontSize: 9,
                fontWeight: '700',
                color: dirColor,
                textTransform: 'uppercase',
                letterSpacing: 0.4,
              }}
            >
              {isOweMe ? tStr(lang, 'oweMe') : tStr(lang, 'iOwe')}
            </Text>
          </View>
          <Text style={{ fontSize: 15, fontWeight: '700', color: t.text }}>
            {isOweMe ? '+' : '−'}
            {fmtMoney(remaining, currency)}
          </Text>
          <Text style={{ fontSize: 10, color: t.textSec, marginTop: 2 }}>
            {unitOf(currency)}
          </Text>
        </View>
      </View>
    </Pressable>
  );
};
