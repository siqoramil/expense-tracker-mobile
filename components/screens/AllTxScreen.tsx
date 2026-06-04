import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { fmtDate } from '../../lib/format';
import { tStr } from '../../lib/i18n';
import { catLabel, useStore, type Transaction } from '../../lib/store';
import type { Tokens } from '../../lib/tokens';
import { Icon } from '../Icon';
import { Card, EmptyState, ScreenHeader, SegmentedControl, TxRow } from '../ui';

type Filter = 'all' | 'income' | 'expense';

export const AllTxScreen: React.FC<{
  t: Tokens;
  onBack: () => void;
  onOpenTx: (tx: Transaction) => void;
}> = ({ t, onBack, onOpenTx }) => {
  const s = useStore();
  const lang = s.prefs.lang;
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState<Filter>('all');

  const catById = useMemo(() => {
    const map: Record<string, (typeof s.categories)[number]> = {};
    s.categories.forEach((c) => {
      map[c.id] = c;
    });
    return map;
    // s.categories is the only dependency that should trigger a rebuild
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [s.categories]);

  const { filtered, groups, sortedDates } = useMemo(() => {
    const ql = q.toLowerCase();
    const filtered = s.tx.filter((x) => {
      if (filter !== 'all' && x.kind !== filter) return false;
      if (q) {
        const hay = ((x.note || '') + ' ' + catLabel(catById[x.cat], lang)).toLowerCase();
        if (!hay.includes(ql)) return false;
      }
      return true;
    });
    const groups: Record<string, Transaction[]> = {};
    filtered.forEach((x) => {
      (groups[x.date] = groups[x.date] || []).push(x);
    });
    const sortedDates = Object.keys(groups).sort((a, b) => b.localeCompare(a));
    return { filtered, groups, sortedDates };
  }, [s.tx, catById, lang, q, filter]);

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
      <ScreenHeader t={t} title={tStr(lang, 'allTransactions')} onBack={onBack} />

      <View style={{ paddingHorizontal: 20, paddingBottom: 12 }}>
        <View style={{ position: 'relative', marginBottom: 10 }}>
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
            placeholder={tStr(lang, 'searchPlaceholder')}
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
        <SegmentedControl
          t={t}
          value={filter}
          onChange={setFilter}
          options={[
            { k: 'all', label: 'All' },
            { k: 'income', label: tStr(lang, 'income') },
            { k: 'expense', label: tStr(lang, 'expenses') },
          ]}
        />
      </View>

      <View style={{ paddingHorizontal: 20 }}>
        {filtered.length === 0 ? (
          <Card t={t}>
            <EmptyState
              icon="wallet"
              title={tStr(lang, 'noTransactions')}
              subtitle={tStr(lang, 'noTransactionsSub')}
              t={t}
            />
          </Card>
        ) : (
          sortedDates.map((date) => (
            <View key={date} style={{ marginBottom: 14 }}>
              <Text
                style={{
                  fontSize: 12,
                  color: t.textSec,
                  fontWeight: '600',
                  marginBottom: 6,
                  letterSpacing: 0.3,
                  textTransform: 'uppercase',
                }}
              >
                {fmtDate(date, lang)}
              </Text>
              <Card t={t} style={{ paddingHorizontal: 16, paddingVertical: 4 }}>
                {groups[date].map((tx, i, arr) => (
                  <TxRow
                    key={tx.id}
                    tx={tx}
                    t={t}
                    last={i === arr.length - 1}
                    onPress={() => onOpenTx(tx)}
                  />
                ))}
              </Card>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
};
