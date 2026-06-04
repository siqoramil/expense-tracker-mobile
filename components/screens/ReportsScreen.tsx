import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { fmtMoney, last6Months } from '../../lib/format';
import { tStr } from '../../lib/i18n';
import { selectMonth, useStore } from '../../lib/store';
import { toast } from '../../lib/toast';
import type { Tokens } from '../../lib/tokens';
import { Icon } from '../Icon';
import { Card, ScreenHeader } from '../ui';

export const ReportsScreen: React.FC<{ t: Tokens; onBack: () => void }> = ({ t, onBack }) => {
  const s = useStore();
  const lang = s.prefs.lang;
  const months = last6Months();
  const totalInc = months.reduce((a, m) => a + selectMonth(s, m.key).income, 0);
  const totalExp = months.reduce((a, m) => a + selectMonth(s, m.key).expense, 0);

  const handleExport = () => {
    toast(lang === 'uz' ? 'Eksport qilindi' : 'Exported');
  };

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
      <ScreenHeader t={t} title={tStr(lang, 'reports')} onBack={onBack} />
      <View style={{ paddingHorizontal: 20, paddingBottom: 16, flexDirection: 'row', gap: 10 }}>
        <SumCard
          t={t}
          label={lang === 'uz' ? '6 oy kirim' : '6mo Income'}
          amount={totalInc}
          kind="income"
        />
        <SumCard
          t={t}
          label={lang === 'uz' ? '6 oy chiqim' : '6mo Expenses'}
          amount={totalExp}
          kind="expense"
        />
      </View>
      <View style={{ paddingHorizontal: 20 }}>
        <Card
          t={t}
          onPress={handleExport}
          style={{ padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12 }}
        >
          <View
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              backgroundColor: '#0EA5E922',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon name="download" size={18} color="#0EA5E9" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 14, fontWeight: '600', color: t.text }}>
              {tStr(lang, 'exportData')} (CSV)
            </Text>
            <Text style={{ fontSize: 12, color: t.textSec, marginTop: 2 }}>
              {s.tx.length} {lang === 'uz' ? 'amallar' : 'transactions'}
            </Text>
          </View>
          <Icon name="chevron-right" size={16} color={t.textTer} />
        </Card>
      </View>
    </ScrollView>
  );
};

const SumCard: React.FC<{
  label: string;
  amount: number;
  kind: 'income' | 'expense';
  t: Tokens;
}> = ({ label, amount, kind, t }) => {
  const s = useStore();
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
        {fmtMoney(amount, s.prefs.currency)}
      </Text>
    </View>
  );
};
