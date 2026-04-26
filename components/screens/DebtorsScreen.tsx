import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { fmtDate, fmtMoney, today, unitOf } from '../../lib/format';
import { tStr } from '../../lib/i18n';
import { useStore, type Debt, type DebtDirection } from '../../lib/store';
import type { Tokens } from '../../lib/tokens';
import { Icon } from '../Icon';
import { Card, EmptyState, Press, ScreenHeader, SegmentedControl } from '../ui';

type Props = {
  t: Tokens;
  onOpen: (d: Debt) => void;
  onAdd: () => void;
};

type Filter = 'all' | 'due' | 'overdue';

export const DebtorsScreen: React.FC<Props> = ({ t, onOpen, onAdd }) => {
  const s = useStore();
  const lang = s.prefs.lang;
  const [dir, setDir] = useState<DebtDirection>('owe_me');
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState<Filter>('all');

  const tdy = today();
  const filtered = s.debts.filter((d) => {
    if (d.archived) return false;
    if (d.direction !== dir) return false;
    if (q && !d.name.toLowerCase().includes(q.toLowerCase())) return false;
    const overdue = new Date(d.due).getTime() < tdy.getTime() && d.paid < d.amount;
    if (filter === 'overdue' && !overdue) return false;
    if (filter === 'due' && !(new Date(d.due).getTime() - tdy.getTime() < 7 * 86_400_000 && !overdue)) return false;
    return true;
  });

  const total = filtered.reduce((a, d) => a + (d.amount - d.paid), 0);
  const overdueN = s.debts.filter(
    (d) => !d.archived && d.direction === dir && new Date(d.due).getTime() < tdy.getTime() && d.paid < d.amount,
  ).length;
  const dueWk = s.debts.filter(
    (d) =>
      !d.archived &&
      d.direction === dir &&
      new Date(d.due).getTime() - tdy.getTime() < 7 * 86_400_000 &&
      new Date(d.due).getTime() >= tdy.getTime() &&
      d.paid < d.amount,
  ).length;

  const filters: { k: Filter; l: string }[] = [
    { k: 'all', l: 'All' },
    { k: 'due', l: 'Due soon' },
    { k: 'overdue', l: 'Overdue' },
  ];

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 160 }}>
      <ScreenHeader
        t={t}
        title={tStr(lang, 'debtors')}
        subtitle={`${filtered.length} ${lang === 'uz' ? 'yozuv' : 'records'}`}
        trailing={
          <Press
            onPress={onAdd}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: t.accent,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon name="plus" size={18} color="#fff" stroke={2.5} />
          </Press>
        }
      />

      <View style={{ paddingHorizontal: 20, paddingBottom: 14 }}>
        <SegmentedControl
          t={t}
          value={dir}
          onChange={setDir}
          options={[
            { k: 'owe_me', label: tStr(lang, 'oweMe') },
            { k: 'i_owe', label: tStr(lang, 'iOwe') },
          ]}
        />
      </View>

      <View style={{ paddingHorizontal: 20, paddingBottom: 16 }}>
        <Card
          t={t}
          style={{
            padding: 22,
            backgroundColor: dir === 'owe_me' ? t.accent : t.expense,
            borderColor: 'transparent',
            overflow: 'hidden',
          }}
        >
          <View
            style={{
              position: 'absolute',
              top: -30,
              right: -30,
              width: 140,
              height: 140,
              borderRadius: 70,
              backgroundColor: 'rgba(255,255,255,0.1)',
            }}
          />
          <Text
            style={{
              fontSize: 12,
              color: 'rgba(255,255,255,0.85)',
              fontWeight: '600',
              letterSpacing: 0.4,
              marginBottom: 6,
            }}
          >
            {dir === 'owe_me' ? tStr(lang, 'totalOwedYou') : tStr(lang, 'totalYouOwe')}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6 }}>
            <Text
              style={{
                fontSize: 32,
                fontWeight: '700',
                color: '#fff',
                letterSpacing: -1,
              }}
            >
              {fmtMoney(total, s.prefs.currency)}
            </Text>
            {unitOf(s.prefs.currency) ? (
              <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)', fontWeight: '500' }}>
                {unitOf(s.prefs.currency)}
              </Text>
            ) : null}
          </View>
          <View
            style={{
              marginTop: 12,
              paddingTop: 12,
              borderTopWidth: 1,
              borderTopColor: 'rgba(255,255,255,0.18)',
              flexDirection: 'row',
              gap: 18,
            }}
          >
            <MiniS label={tStr(lang, 'active')} value={filtered.length} />
            <MiniS label={tStr(lang, 'overdue')} value={overdueN} />
            <MiniS label={tStr(lang, 'dueThisWeek')} value={dueWk} />
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
          <TextInput
            value={q}
            onChangeText={setQ}
            placeholder={lang === 'uz' ? 'Ism bo‘yicha qidirish…' : 'Search name...'}
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
        {filters.map(({ k, l }) => (
          <Pressable
            key={k}
            onPress={() => setFilter(k)}
            style={{
              paddingVertical: 6,
              paddingHorizontal: 12,
              borderRadius: 100,
              backgroundColor: filter === k ? t.text : t.surface,
              borderWidth: 1,
              borderColor: filter === k ? t.text : t.border,
            }}
          >
            <Text
              style={{
                color: filter === k ? t.surface : t.text,
                fontSize: 12,
                fontWeight: '500',
              }}
            >
              {l}
            </Text>
          </Pressable>
        ))}
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
          filtered.map((d) => <DebtorCard key={d.id} debtor={d} t={t} onPress={() => onOpen(d)} />)
        )}
      </View>
    </ScrollView>
  );
};

const MiniS: React.FC<{ label: string; value: number }> = ({ label, value }) => (
  <View>
    <Text style={{ fontSize: 17, fontWeight: '700', color: '#fff' }}>{value}</Text>
    <Text style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.75)', marginTop: 1, fontWeight: '500' }}>
      {label}
    </Text>
  </View>
);

const DebtorCard: React.FC<{ debtor: Debt; t: Tokens; onPress: () => void }> = ({ debtor, t, onPress }) => {
  const s = useStore();
  const lang = s.prefs.lang;
  const overdue = new Date(debtor.due).getTime() < today().getTime() && debtor.paid < debtor.amount;
  const remaining = debtor.amount - debtor.paid;
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
        padding: 16,
        borderRadius: 16,
        backgroundColor: t.surface,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: t.border,
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
          <Text style={{ fontSize: 11, color: t.textTer }}>{fmtDate(debtor.due, lang)}</Text>
          {debtor.paid > 0 ? (
            <Text style={{ fontSize: 11, color: t.income, marginLeft: 6 }}>
              · {fmtMoney(debtor.paid, s.prefs.currency)} {tStr(lang, 'paid').toLowerCase()}
            </Text>
          ) : null}
        </View>
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        <Text style={{ fontSize: 15, fontWeight: '700', color: t.text }}>
          {fmtMoney(remaining, s.prefs.currency)}
        </Text>
        <Text style={{ fontSize: 10, color: t.textSec, marginTop: 2 }}>
          {unitOf(s.prefs.currency)}
        </Text>
      </View>
    </Pressable>
  );
};
