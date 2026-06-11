import React, { useCallback, useMemo, useState } from 'react';
import { SectionList, StyleSheet, Text, View } from 'react-native';
import { AppTextInput } from '../AppTextInput';
import { fmtDate } from '../../lib/format';
import { tStr } from '../../lib/i18n';
import { catLabel, useStore, type Transaction } from '../../lib/store';
import type { Tokens } from '../../lib/tokens';
import { Icon } from '../Icon';
import { Card, EmptyState, SegmentedControl, TxRow } from '../ui';

type Filter = 'all' | 'income' | 'expense';

export const AllTxScreen: React.FC<{
  t: Tokens;
  onOpenTx: (tx: Transaction) => void;
}> = ({ t, onOpenTx }) => {
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

  const { groups, sortedDates } = useMemo(() => {
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
    sortedDates.forEach((date) => {
      groups[date].sort((a, b) => (b.time ?? '').localeCompare(a.time ?? ''));
    });
    return { groups, sortedDates };
  }, [s.tx, catById, lang, q, filter]);

  const sections = useMemo(
    () => sortedDates.map((date) => ({ title: date, data: groups[date] })),
    [sortedDates, groups],
  );

  const renderItem = useCallback(
    ({ item: tx, index: i, section }: { item: Transaction; index: number; section: { data: Transaction[] } }) => {
      const isFirst = i === 0;
      const isLast = i === section.data.length - 1;
      return (
        <View style={{ paddingHorizontal: 20, marginBottom: isLast ? 14 : 0 }}>
          <View
            style={{
              backgroundColor: t.surface,
              borderLeftWidth: StyleSheet.hairlineWidth,
              borderRightWidth: StyleSheet.hairlineWidth,
              borderTopWidth: isFirst ? StyleSheet.hairlineWidth : 0,
              borderBottomWidth: isLast ? StyleSheet.hairlineWidth : 0,
              borderColor: t.border,
              borderTopLeftRadius: isFirst ? 20 : 0,
              borderTopRightRadius: isFirst ? 20 : 0,
              borderBottomLeftRadius: isLast ? 20 : 0,
              borderBottomRightRadius: isLast ? 20 : 0,
              paddingHorizontal: 16,
              paddingVertical: 4,
            }}
          >
            <TxRow
              tx={tx}
              t={t}
              last={isLast}
              onPress={() => onOpenTx(tx)}
            />
          </View>
        </View>
      );
    },
    [t, onOpenTx],
  );

  const listHeader = (
    <>
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
          <AppTextInput
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
    </>
  );

  return (
    <SectionList
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 120 }}
      sections={sections}
      keyExtractor={(tx) => tx.id}
      ListHeaderComponent={listHeader}
      ListEmptyComponent={
        <View style={{ paddingHorizontal: 20 }}>
          <Card t={t}>
            <EmptyState
              icon="wallet"
              title={tStr(lang, 'noTransactions')}
              subtitle={tStr(lang, 'noTransactionsSub')}
              t={t}
            />
          </Card>
        </View>
      }
      renderSectionHeader={({ section }) => (
        <View style={{ paddingHorizontal: 20 }}>
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
            {fmtDate(section.title, lang)}
          </Text>
        </View>
      )}
      renderItem={renderItem}
    />
  );
};
