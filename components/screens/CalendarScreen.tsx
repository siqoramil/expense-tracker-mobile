import React, { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { fmtDate, isoDate, today } from '../../lib/format';
import { tStr } from '../../lib/i18n';
import { useStore } from '../../lib/store';
import type { Tokens } from '../../lib/tokens';
import { Icon } from '../Icon';
import { Card, EmptyState, ScreenHeader, SectionHeader, TxRow } from '../ui';

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export const CalendarScreen: React.FC<{ t: Tokens; onBack: () => void }> = ({ t, onBack }) => {
  const s = useStore();
  const lang = s.prefs.lang;
  const [cursor, setCursor] = useState(() => {
    const d = today();
    return { y: d.getFullYear(), m: d.getMonth() };
  });
  const [selected, setSelected] = useState(isoDate(today()));

  const firstDay = new Date(cursor.y, cursor.m, 1);
  const daysInMonth = new Date(cursor.y, cursor.m + 1, 0).getDate();
  const startOffset = (firstDay.getDay() + 6) % 7;

  const byDay: Record<number, { inc: number; exp: number }> = {};
  s.tx.forEach((x) => {
    const d = new Date(x.date);
    if (d.getFullYear() === cursor.y && d.getMonth() === cursor.m) {
      const day = d.getDate();
      byDay[day] = byDay[day] || { inc: 0, exp: 0 };
      if (x.kind === 'income') byDay[day].inc += x.amount;
      else byDay[day].exp += x.amount;
    }
  });

  const selTx = s.tx.filter((x) => x.date === selected);

  const cells: React.ReactNode[] = [];
  for (let i = 0; i < startOffset; i++) {
    cells.push(<View key={'e' + i} style={{ width: '14.28%', aspectRatio: 1 }} />);
  }
  for (let i = 0; i < daysInMonth; i++) {
    const d = i + 1;
    const iso = `${cursor.y}-${String(cursor.m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const info = byDay[d];
    const isSel = selected === iso;
    cells.push(
      <Pressable
        key={d}
        onPress={() => setSelected(iso)}
        style={{
          width: '14.28%',
          aspectRatio: 1,
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 9,
          backgroundColor: isSel ? t.accent : info ? t.accentSoft : 'transparent',
        }}
      >
        <Text
          style={{
            color: isSel ? '#fff' : t.text,
            fontSize: 12,
            fontWeight: isSel ? '700' : '500',
          }}
        >
          {d}
        </Text>
        {info ? (
          <View
            style={{
              width: 4,
              height: 4,
              borderRadius: 2,
              backgroundColor: isSel ? '#fff' : t.accent,
              marginTop: 2,
            }}
          />
        ) : null}
      </Pressable>,
    );
  }

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
      <ScreenHeader t={t} title={tStr(lang, 'calendar')} onBack={onBack} />
      <View style={{ paddingHorizontal: 20, paddingBottom: 14 }}>
        <Card t={t} style={{ padding: 14 }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 10,
            }}
          >
            <Pressable
              onPress={() =>
                setCursor((c) => (c.m === 0 ? { y: c.y - 1, m: 11 } : { ...c, m: c.m - 1 }))
              }
              style={{
                width: 30,
                height: 30,
                borderRadius: 15,
                backgroundColor: t.surfaceAlt,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Icon name="chevron-left" size={14} color={t.textSec} />
            </Pressable>
            <Text style={{ fontSize: 15, fontWeight: '600', color: t.text }}>
              {MONTH_NAMES[cursor.m]} {cursor.y}
            </Text>
            <Pressable
              onPress={() =>
                setCursor((c) => (c.m === 11 ? { y: c.y + 1, m: 0 } : { ...c, m: c.m + 1 }))
              }
              style={{
                width: 30,
                height: 30,
                borderRadius: 15,
                backgroundColor: t.surfaceAlt,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Icon name="chevron-right" size={14} color={t.textSec} />
            </Pressable>
          </View>
          <View style={{ flexDirection: 'row' }}>
            {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
              <Text
                key={i}
                style={{
                  width: '14.28%',
                  textAlign: 'center',
                  fontSize: 10,
                  color: t.textTer,
                  fontWeight: '600',
                  marginBottom: 4,
                }}
              >
                {d}
              </Text>
            ))}
          </View>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>{cells}</View>
        </Card>
      </View>
      <SectionHeader t={t} title={fmtDate(selected, lang)} />
      <View style={{ paddingHorizontal: 20 }}>
        {selTx.length === 0 ? (
          <Card t={t}>
            <EmptyState icon="calendar" title={tStr(lang, 'noTransactions')} t={t} />
          </Card>
        ) : (
          <Card t={t} style={{ paddingHorizontal: 16, paddingVertical: 4 }}>
            {selTx.map((tx, i, arr) => (
              <TxRow key={tx.id} tx={tx} t={t} last={i === arr.length - 1} />
            ))}
          </Card>
        )}
      </View>
    </ScrollView>
  );
};
