import React, { useMemo } from 'react';
import { FlatList, Text, View } from 'react-native';
import { fmtMoney, last6Months } from '../../lib/format';
import { tStr } from '../../lib/i18n';
import { catLabel, useStore, type Budget } from '../../lib/store';
import type { Tokens } from '../../lib/tokens';
import { Card, CatIcon, EmptyState } from '../ui';

export const BudgetsScreen: React.FC<{ t: Tokens }> = ({ t }) => {
  const s = useStore();
  const lang = s.prefs.lang;
  const curMo = useMemo(() => last6Months().slice(-1)[0].key, []);
  const spentByCat = useMemo(() => {
    const map: Record<string, number> = {};
    s.tx.forEach((x) => {
      if (x.kind === 'expense' && x.date.startsWith(curMo)) {
        map[x.cat] = (map[x.cat] || 0) + x.amount;
      }
    });
    return map;
  }, [s.tx, curMo]);

  return (
    <FlatList
      data={s.budgets}
      keyExtractor={(b) => b.id}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 120, gap: 10 }}
      ListEmptyComponent={
        <Card t={t}>
          <EmptyState icon="chart" title={tStr(lang, 'noBudgets')} t={t} />
        </Card>
      }
      renderItem={({ item: b }: { item: Budget }) => {
        const cat = s.categories.find((c) => c.id === b.cat);
        const spent = spentByCat[b.cat] || 0;
        const pct = Math.min(100, (spent / b.limit) * 100);
        const over = spent > b.limit;
        return (
          <Card key={b.id} t={t} style={{ padding: 16 }}>
            <View
              style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 }}
            >
              <CatIcon cat={b.cat} size={36} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: t.text }}>
                  {catLabel(cat, lang)}
                </Text>
                <Text style={{ fontSize: 12, color: t.textSec, marginTop: 2 }}>
                  {fmtMoney(spent, s.prefs.currency)} / {fmtMoney(b.limit, s.prefs.currency)}
                </Text>
              </View>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: '700',
                  color: over ? t.expense : t.text,
                }}
              >
                {Math.round(pct)}%
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
                  width: `${pct}%`,
                  height: '100%',
                  backgroundColor: over ? t.expense : cat?.color || t.accent,
                }}
              />
            </View>
            <Text style={{ fontSize: 11.5, color: t.textSec, marginTop: 6 }}>
              {over
                ? `${tStr(lang, 'overspent')} ${fmtMoney(spent - b.limit, s.prefs.currency)}`
                : `${fmtMoney(b.limit - spent, s.prefs.currency)} ${tStr(lang, 'left')}`}
            </Text>
          </Card>
        );
      }}
    />
  );
};
