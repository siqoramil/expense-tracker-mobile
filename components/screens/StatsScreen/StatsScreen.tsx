import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import type { Tokens } from '@/lib/tokens';
import { Card, CatIcon, EmptyState, SectionHeader } from '@/components/ui';
import { Icon } from '@/components/Icon';
import { catLabel, selectMonth, useStore } from '@/lib/store';
import { fmtMoney, last6Months } from '@/lib/format';
import { tStr } from '@/lib/i18n';

export const StatsScreen = ({ t, contentTopPad = 0 }: { t: Tokens; contentTopPad?: number }) => {
  const s = useStore();
  const lang = s.prefs.lang;
  const months = useMemo(() => last6Months(), []);
  const { data, maxVal, totalInc, totalExp } = useMemo(() => {
    const d = months.map((m) => {
      const md = selectMonth(s, m.key);
      return { m: m.label, income: md.income, expense: md.expense };
    });
    return {
      data: d,
      maxVal: Math.max(...d.flatMap((row) => [row.income, row.expense]), 1),
      totalInc: d.reduce((a, row) => a + row.income, 0),
      totalExp: d.reduce((a, row) => a + row.expense, 0),
    };
    // selectMonth reads the whole store; re-run only when tx/months change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [s.tx, months]);

  const catBreakdown = useMemo(() => {
    const curMo = months[months.length - 1].key;
    const map: Record<string, number> = {};
    s.tx
      .filter((x) => x.kind === 'expense' && x.date.startsWith(curMo))
      .forEach((x) => {
        map[x.cat] = (map[x.cat] || 0) + x.amount;
      });
    return Object.entries(map)
      .map(([cat, amount]) => ({ cat, amount }))
      .sort((a, b) => b.amount - a.amount);
  }, [s.tx, months]);

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 160, paddingTop: contentTopPad }}>
      <View style={{ paddingHorizontal: 20, paddingBottom: 14, flexDirection: 'row', gap: 10 }}>
        <SumCard
          t={t}
          label={tStr(lang, 'totalIncome')}
          amount={totalInc}
          kind="income"
          currency={s.prefs.currency}
        />
        <SumCard
          t={t}
          label={tStr(lang, 'totalExpenses')}
          amount={totalExp}
          kind="expense"
          currency={s.prefs.currency}
        />
      </View>

      <View style={{ paddingHorizontal: 20, paddingBottom: 20 }}>
        <Card t={t} style={{ padding: 16 }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 14,
            }}
          >
            <Text style={{ fontSize: 15, fontWeight: '600', color: t.text }}>
              {tStr(lang, 'incomeVsExpenses')}
            </Text>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <LegendDot color={t.income} label={tStr(lang, 'income')} color2={t.textSec} />
              <LegendDot color={t.expense} label={tStr(lang, 'expenses')} color2={t.textSec} />
            </View>
          </View>
          <BarChart data={data} max={maxVal} t={t} />
        </Card>
      </View>

      <SectionHeader t={t} title={tStr(lang, 'topCategories')} />
      <View style={{ paddingHorizontal: 20 }}>
        {catBreakdown.length === 0 ? (
          <Card t={t}>
            <EmptyState icon="chart" title={tStr(lang, 'noTransactions')} t={t} />
          </Card>
        ) : (
          <Card t={t} style={{ paddingHorizontal: 16, paddingVertical: 12 }}>
            {catBreakdown.map((row, i, arr) => {
              const c = s.categories.find((x) => x.id === row.cat);
              const pct = Math.min(100, (row.amount / catBreakdown[0].amount) * 100);
              return (
                <View
                  key={row.cat}
                  style={{
                    paddingVertical: 10,
                    borderBottomWidth: i === arr.length - 1 ? 0 : StyleSheet.hairlineWidth,
                    borderBottomColor: t.divider,
                  }}
                >
                  <View
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 7 }}
                  >
                    <CatIcon cat={row.cat} size={30} />
                    <Text style={{ flex: 1, fontSize: 14, fontWeight: '500', color: t.text }}>
                      {catLabel(c, lang)}
                    </Text>
                    <Text style={{ fontSize: 14, fontWeight: '600', color: t.text }}>
                      {fmtMoney(row.amount, s.prefs.currency)}
                    </Text>
                  </View>
                  <View
                    style={{
                      height: 4,
                      borderRadius: 2,
                      backgroundColor: t.surfaceAlt,
                      marginLeft: 40,
                      overflow: 'hidden',
                    }}
                  >
                    <View
                      style={{
                        width: `${pct}%`,
                        height: '100%',
                        backgroundColor: c?.color || t.accent,
                      }}
                    />
                  </View>
                </View>
              );
            })}
          </Card>
        )}
      </View>
    </ScrollView>
  );
};

const LegendDot = ({
  color,
  label,
  color2,
}: { color: string; label: string; color2: string }) => (
  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
    <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color }} />
    <Text style={{ fontSize: 11, color: color2, fontWeight: '500' }}>{label}</Text>
  </View>
);

const SumCard = ({ label, amount, kind, currency, t }: { label: string; amount: number; kind: 'income' | 'expense'; currency: import('@/lib/format').Currency; t: Tokens }) => {
  const up = kind === 'income';
  const color = up ? t.income : t.expense;
  return (
    <View
      style={{
        flex: 1,
        paddingVertical: 13,
        paddingHorizontal: 13,
        borderRadius: 16,
        backgroundColor: t.surface,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: t.border,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 }}>
        <View
          style={{
            width: 22,
            height: 22,
            borderRadius: 11,
            backgroundColor: up ? t.incomeSoft : t.expenseSoft,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon
            name={up ? 'arrow-down-left' : 'arrow-up-right'}
            size={12}
            color={color}
            stroke={2.5}
          />
        </View>
        <Text style={{ fontSize: 12, color: t.textSec, fontWeight: '500' }}>{label}</Text>
      </View>
      <Text style={{ fontSize: 17, fontWeight: '700', color: t.text, letterSpacing: -0.4 }}>
        {fmtMoney(amount, currency)}
      </Text>
    </View>
  );
};

const BarChart = ({ data, max, t }: { data: { m: string; income: number; expense: number }[]; max: number; t: Tokens }) => {
  const H = 150;
  const barW = 11;
  return (
    <View>
      <View
        style={{
          height: H,
          flexDirection: 'row',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          paddingBottom: 8,
          borderBottomWidth: 1,
          borderBottomColor: t.divider,
        }}
      >
        {data.map((d, i) => {
          const incH = (d.income / max) * (H - 16);
          const expH = (d.expense / max) * (H - 16);
          const isLast = i === data.length - 1;
          return (
            <View
              key={i}
              style={{
                flex: 1,
                flexDirection: 'row',
                alignItems: 'flex-end',
                justifyContent: 'center',
                gap: 3,
              }}
            >
              <View
                style={{
                  width: barW,
                  height: incH,
                  borderTopLeftRadius: 4,
                  borderTopRightRadius: 4,
                  backgroundColor: t.income,
                  opacity: isLast ? 1 : 0.85,
                }}
              />
              <View
                style={{
                  width: barW,
                  height: expH,
                  borderTopLeftRadius: 4,
                  borderTopRightRadius: 4,
                  backgroundColor: t.expense,
                  opacity: isLast ? 1 : 0.85,
                }}
              />
            </View>
          );
        })}
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
        {data.map((d, i) => (
          <Text
            key={i}
            style={{
              flex: 1,
              textAlign: 'center',
              fontSize: 11,
              fontWeight: '500',
              color: i === data.length - 1 ? t.text : t.textSec,
            }}
          >
            {d.m}
          </Text>
        ))}
      </View>
    </View>
  );
};
