import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { fmtMoney, last6Months } from '../../lib/format';
import { tStr } from '../../lib/i18n';
import { catLabel, useStore } from '../../lib/store';
import type { Tokens } from '../../lib/tokens';
import { Card, CatIcon, EmptyState, ScreenHeader } from '../ui';

export const BudgetsScreen: React.FC<{ t: Tokens; onBack: () => void }> = ({ t, onBack }) => {
  const s = useStore();
  const lang = s.prefs.lang;
  const curMo = last6Months().slice(-1)[0].key;
  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
      <ScreenHeader t={t} title={tStr(lang, 'budgets')} onBack={onBack} />
      <View style={{ paddingHorizontal: 20, gap: 10 }}>
        {s.budgets.length === 0 ? (
          <Card t={t}>
            <EmptyState icon="chart" title={lang === 'uz' ? 'Byudjetlar yo‘q' : 'No budgets'} t={t} />
          </Card>
        ) : (
          s.budgets.map((b) => {
            const cat = s.categories.find((c) => c.id === b.cat);
            const spent = s.tx
              .filter((x) => x.cat === b.cat && x.kind === 'expense' && x.date.startsWith(curMo))
              .reduce((a, x) => a + x.amount, 0);
            const pct = Math.min(100, (spent / b.limit) * 100);
            const over = spent > b.limit;
            return (
              <Card key={b.id} t={t} style={{ padding: 16 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 }}>
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
          })
        )}
      </View>
    </ScrollView>
  );
};
