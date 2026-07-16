import React, { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { Tokens } from '@/lib/tokens';
import { Card, EmptyState, TxRow } from '@/components/ui';
import { Icon } from '@/components/Icon';
import { fmtDate, fmtMoney, isoDate, today } from '@/lib/format';
import { tStr } from '@/lib/i18n';
import { type Transaction, useStore, useStoreSelector } from '@/lib/store';

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

const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

type DayInfo = { inc: number; exp: number };

type CellProps = {
  day: number;
  iso: string;
  info: DayInfo | undefined;
  isToday: boolean;
  isSelected: boolean;
  isCurrentMonth: boolean;
  intensity: number;
  onPress: (iso: string) => void;
  t: Tokens;
};

const DayCell = ({
  day,
  iso,
  info,
  isToday,
  isSelected,
  isCurrentMonth,
  intensity,
  onPress,
  t,
}: CellProps) => {
  const hasExpense = intensity > 0;
  const hasIncome = info ? info.inc > 0 : false;

  const numberColor: string = (() => {
    if (isSelected) return t.dark ? '#0B0B0F' : '#FFFFFF';
    if (isToday) return t.accent;
    return isCurrentMonth ? t.text : t.textTer;
  })();

  const barHeight = hasExpense ? Math.max(2, Math.round(intensity * 14)) : 0;

  const barColor = t.expense;

  return (
    <Pressable
      onPress={() => onPress(iso)}
      style={styles.cellWrapper}
    >
      <View
        style={[
          styles.cell,
          isSelected && { backgroundColor: t.accent },
        ]}
      >
        <Text
          style={[
            styles.cellText,
            { color: numberColor },
            isSelected && styles.cellTextSelected,
            isToday && !isSelected && { fontWeight: '700' },
          ]}
        >
          {day}
        </Text>

        {isToday && !isSelected && (
          <View style={[styles.todayDot, { backgroundColor: t.accent }]} />
        )}

        {!isSelected && hasIncome && (
          <View style={[styles.incomeDot, { backgroundColor: t.income }]} />
        )}

        {isSelected && (hasExpense || hasIncome) && (
          <View style={[styles.incomeDot, { backgroundColor: t.dark ? '#0B0B0F' : '#FFFFFF', opacity: 0.7 }]} />
        )}
      </View>

      {hasExpense ? (
        <View style={styles.barTrack}>
          <View
            style={[
              styles.barFill,
              {
                height: barHeight,
                backgroundColor: isSelected ? t.accent : barColor,
                opacity: isSelected ? 0.5 : 0.55 + intensity * 0.35,
              },
            ]}
          />
        </View>
      ) : (
        <View style={styles.barTrack} />
      )}
    </Pressable>
  );
};

export const CalendarScreen = ({ t, onOpenTx }: { t: Tokens; onOpenTx?: (tx: Transaction) => void }) => {
  const s = useStore();
  const lang = s.prefs.lang;
  const currency = useStoreSelector((st) => st.prefs.currency);

  const [cursor, setCursor] = useState(() => {
    const d = today();
    return { y: d.getFullYear(), m: d.getMonth() };
  });
  const [selected, setSelected] = useState(isoDate(today()));

  const todayIso = isoDate(today());

  const firstDay = new Date(cursor.y, cursor.m, 1);
  const daysInMonth = new Date(cursor.y, cursor.m + 1, 0).getDate();
  const startOffset = (firstDay.getDay() + 6) % 7;

  const byDay = useMemo(() => {
    const map: Record<number, DayInfo> = {};
    s.tx.forEach((x) => {
      const d = new Date(x.date);
      if (d.getFullYear() === cursor.y && d.getMonth() === cursor.m) {
        const day = d.getDate();
        map[day] = map[day] || { inc: 0, exp: 0 };
        if (x.kind === 'income') map[day].inc += x.amount;
        else map[day].exp += x.amount;
      }
    });
    return map;
  }, [s.tx, cursor.y, cursor.m]);

  const maxDayExpense = useMemo(() => {
    let max = 0;
    for (let d = 1; d <= daysInMonth; d++) {
      const info = byDay[d];
      if (info && info.exp > max) max = info.exp;
    }
    return max;
  }, [byDay, daysInMonth]);

  const selTx = useMemo(
    () => s.tx.filter((x) => x.date === selected),
    [s.tx, selected],
  );

  const selDayInc = useMemo(
    () => selTx.filter((x) => x.kind === 'income').reduce((acc, x) => acc + x.amount, 0),
    [selTx],
  );
  const selDayExp = useMemo(
    () => selTx.filter((x) => x.kind === 'expense').reduce((acc, x) => acc + x.amount, 0),
    [selTx],
  );

  const handleDayPress = useCallback((iso: string) => setSelected(iso), []);

  const prevMonth = useCallback(
    () => setCursor((c) => (c.m === 0 ? { y: c.y - 1, m: 11 } : { ...c, m: c.m - 1 })),
    [],
  );
  const nextMonth = useCallback(
    () => setCursor((c) => (c.m === 11 ? { y: c.y + 1, m: 0 } : { ...c, m: c.m + 1 })),
    [],
  );

  const prevMonthDays = useMemo(
    () => new Date(cursor.y, cursor.m, 0).getDate(),
    [cursor.y, cursor.m],
  );

  const cells = useMemo(() => {
    const nodes: React.ReactNode[] = [];

    for (let i = 0; i < startOffset; i++) {
      const day = prevMonthDays - startOffset + 1 + i;
      const prevM = cursor.m === 0 ? 11 : cursor.m - 1;
      const prevY = cursor.m === 0 ? cursor.y - 1 : cursor.y;
      const iso = `${prevY}-${String(prevM + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      nodes.push(
        <DayCell
          key={'prev-' + i}
          day={day}
          iso={iso}
          info={undefined}
          isToday={iso === todayIso}
          isSelected={iso === selected}
          isCurrentMonth={false}
          intensity={0}
          onPress={handleDayPress}
          t={t}
        />,
      );
    }

    for (let i = 0; i < daysInMonth; i++) {
      const d = i + 1;
      const iso = `${cursor.y}-${String(cursor.m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const info = byDay[d];
      const exp = info ? info.exp : 0;
      const intensity = maxDayExpense > 0 ? Math.min(1, exp / maxDayExpense) : 0;
      nodes.push(
        <DayCell
          key={'cur-' + d}
          day={d}
          iso={iso}
          info={info}
          isToday={iso === todayIso}
          isSelected={iso === selected}
          isCurrentMonth={true}
          intensity={intensity}
          onPress={handleDayPress}
          t={t}
        />,
      );
    }

    const trailing = 42 - startOffset - daysInMonth;
    for (let i = 0; i < trailing; i++) {
      const day = i + 1;
      const nextM = cursor.m === 11 ? 0 : cursor.m + 1;
      const nextY = cursor.m === 11 ? cursor.y + 1 : cursor.y;
      const iso = `${nextY}-${String(nextM + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      nodes.push(
        <DayCell
          key={'next-' + i}
          day={day}
          iso={iso}
          info={undefined}
          isToday={iso === todayIso}
          isSelected={iso === selected}
          isCurrentMonth={false}
          intensity={0}
          onPress={handleDayPress}
          t={t}
        />,
      );
    }

    return nodes;
  }, [
    cursor.y,
    cursor.m,
    byDay,
    maxDayExpense,
    selected,
    t,
    daysInMonth,
    startOffset,
    prevMonthDays,
    handleDayPress,
    todayIso,
  ]);

  const hasSummaryData = selDayInc > 0 || selDayExp > 0;

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 120 }}
    >
      <View style={styles.calendarSection}>
        <Card t={t} style={styles.calendarCard}>
          <View style={styles.navRow}>
            <Pressable
              onPress={prevMonth}
              hitSlop={8}
              style={[styles.navBtn, { borderColor: t.border }]}
            >
              <Icon name="chevron-left" size={14} color={t.textSec} />
            </Pressable>

            <Pressable
              onPress={() => {
                const d = today();
                setCursor({ y: d.getFullYear(), m: d.getMonth() });
                setSelected(isoDate(d));
              }}
              style={styles.monthLabelContainer}
            >
              <Text style={[styles.monthName, { color: t.text }]}>
                {MONTH_NAMES[cursor.m]}
              </Text>
              <Text style={[styles.yearLabel, { color: t.textTer }]}>
                {cursor.y}
              </Text>
            </Pressable>

            <Pressable
              onPress={nextMonth}
              hitSlop={8}
              style={[styles.navBtn, { borderColor: t.border }]}
            >
              <Icon name="chevron-right" size={14} color={t.textSec} />
            </Pressable>
          </View>

          <View style={styles.weekdayRow}>
            {WEEKDAY_LABELS.map((d, i) => (
              <Text
                key={i}
                style={[
                  styles.weekdayText,
                  { color: i >= 5 ? t.textSec : t.textTer },
                ]}
              >
                {d}
              </Text>
            ))}
          </View>

          <View style={[styles.weekdayDivider, { backgroundColor: t.border }]} />

          <View style={styles.grid}>{cells}</View>
        </Card>
      </View>

      <View style={styles.belowCalendar}>
        <View style={styles.dayHeaderRow}>
          <Text style={[styles.dayLabel, { color: t.textTer }]}>
            {fmtDate(selected, lang).toUpperCase()}
          </Text>
          {hasSummaryData && (
            <View style={styles.summaryChips}>
              {selDayInc > 0 && (
                <View style={[styles.chip, { backgroundColor: t.incomeSoft }]}>
                  <Text style={[styles.chipText, { color: t.income }]}>
                    {'+' + fmtMoney(selDayInc, currency)}
                  </Text>
                </View>
              )}
              {selDayExp > 0 && (
                <View style={[styles.chip, { backgroundColor: t.expenseSoft }]}>
                  <Text style={[styles.chipText, { color: t.expense }]}>
                    {'−' + fmtMoney(selDayExp, currency)}
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>

        {selTx.length === 0 ? (
          <Card t={t}>
            <EmptyState icon="calendar" title={tStr(lang, 'noTransactions')} t={t} />
          </Card>
        ) : (
          <Card t={t} style={styles.txCard}>
            {selTx.map((tx, i, arr) => (
              <TxRow
                key={tx.id}
                tx={tx}
                t={t}
                last={i === arr.length - 1}
                onPress={onOpenTx}
              />
            ))}
          </Card>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  calendarSection: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
  },
  calendarCard: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 16,
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 22,
  },
  navBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthLabelContainer: {
    alignItems: 'center',
    gap: 1,
  },
  monthName: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.4,
  },
  yearLabel: {
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: 0.2,
  },
  weekdayRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  weekdayText: {
    width: '14.28%',
    textAlign: 'center',
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  weekdayDivider: {
    height: StyleSheet.hairlineWidth,
    marginBottom: 6,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  cellWrapper: {
    width: '14.28%',
    alignItems: 'center',
    paddingVertical: 3,
    gap: 2,
  },
  cell: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 1,
  },
  cellText: {
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 16,
  },
  cellTextSelected: {
    fontWeight: '700',
  },
  todayDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
  },
  incomeDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
  },
  barTrack: {
    width: 20,
    height: 14,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  barFill: {
    width: 3,
    borderRadius: 2,
  },
  belowCalendar: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  dayHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    minHeight: 28,
  },
  dayLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.8,
  },
  summaryChips: {
    flexDirection: 'row',
    gap: 6,
  },
  chip: {
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
    letterSpacing: -0.2,
  },
  txCard: {
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
});
