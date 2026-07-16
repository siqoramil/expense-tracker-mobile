import React from 'react';
import { FlatList, Text, View } from 'react-native';
import type { Tokens } from '@/lib/tokens';
import { Card, CatIcon, MoneyText, Switch } from '@/components/ui';
import { actions, catLabel, type Recurring, useStore } from '@/lib/store';
import { today } from '@/lib/format';

export const RecurringScreen = ({ t }: { t: Tokens }) => {
  const s = useStore();
  const lang = s.prefs.lang;
  return (
    <FlatList
      data={s.recurring}
      keyExtractor={(r) => r.id}
      contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 120, gap: 10 }}
      renderItem={({ item: r }: { item: Recurring }) => {
        const cat = s.categories.find((c) => c.id === r.cat);
        const d = new Date(r.nextDate);
        const days = Math.round((d.getTime() - today().getTime()) / 86_400_000);
        return (
          <Card
            key={r.id}
            t={t}
            style={{ padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12 }}
          >
            <CatIcon cat={r.cat} size={38} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, fontWeight: '600', color: t.text }}>{r.note}</Text>
              <Text style={{ fontSize: 12, color: t.textSec, marginTop: 2 }}>
                {catLabel(cat, lang)} · Every {r.every} · In {days} days
              </Text>
            </View>
            <View style={{ alignItems: 'flex-end', gap: 6 }}>
              <MoneyText amount={r.amount} kind={r.kind} t={t} size={14} />
              <Switch
                t={t}
                on={r.enabled}
                onChange={(v) => actions.updateRecurring(r.id, { enabled: v })}
              />
            </View>
          </Card>
        );
      }}
    />
  );
};
