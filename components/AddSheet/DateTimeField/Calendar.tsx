import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import type { Tokens } from '@/lib/tokens';
import { Icon, type IconName } from '@/components/Icon';
import { today } from '@/lib/format';

const WEEK_DAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];
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

const sameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

export const Calendar = ({
  t,
  value,
  onSelect,
}: {
  t: Tokens;
  value: Date;
  onSelect: (d: Date) => void;
}) => {
  const todayDate = today();
  const [view, setView] = useState(new Date(value.getFullYear(), value.getMonth(), 1));

  const year = view.getFullYear();
  const month = view.getMonth();
  const firstDow = new Date(year, month, 1).getDay();
  const mondayOffset = (firstDow + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrev = new Date(year, month, 0).getDate();
  const totalCells = Math.ceil((mondayOffset + daysInMonth) / 7) * 7;

  const cells: { day: number; inMonth: boolean; date: Date }[] = [];
  for (let i = 0; i < mondayOffset; i++) {
    const d = daysInPrev - mondayOffset + 1 + i;
    cells.push({ day: d, inMonth: false, date: new Date(year, month - 1, d) });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ day: d, inMonth: true, date: new Date(year, month, d) });
  }
  let next = 1;
  while (cells.length < totalCells) {
    cells.push({ day: next, inMonth: false, date: new Date(year, month + 1, next) });
    next++;
  }

  const navBtn = (icon: IconName, onPress: () => void) => (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        {
          width: 36,
          height: 36,
          borderRadius: 18,
          backgroundColor: t.surfaceAlt,
          alignItems: 'center',
          justifyContent: 'center',
        },
        pressed && { transform: [{ scale: 0.92 }] },
      ]}
    >
      <Icon name={icon} size={18} color={t.text} stroke={2} />
    </Pressable>
  );

  return (
    <View style={{ paddingHorizontal: 4 }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 18,
          paddingHorizontal: 4,
        }}
      >
        {navBtn('chevron-left', () => setView(new Date(year, month - 1, 1)))}
        <View style={{ alignItems: 'center' }}>
          <Text style={{ color: t.text, fontSize: 17, fontWeight: '700', letterSpacing: -0.3 }}>
            {MONTH_NAMES[month]}
          </Text>
          <Text style={{ color: t.textSec, fontSize: 12, fontWeight: '500', marginTop: 1 }}>
            {year}
          </Text>
        </View>
        {navBtn('chevron-right', () => setView(new Date(year, month + 1, 1)))}
      </View>

      <View style={{ flexDirection: 'row', marginBottom: 6 }}>
        {WEEK_DAYS.map((d) => (
          <View key={d} style={{ flex: 1, alignItems: 'center', paddingVertical: 4 }}>
            <Text
              style={{
                color: t.textTer,
                fontSize: 11,
                fontWeight: '700',
                letterSpacing: 0.6,
              }}
            >
              {d.toUpperCase()}
            </Text>
          </View>
        ))}
      </View>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        {cells.map((cell, i) => {
          const isSel = sameDay(cell.date, value);
          const isToday = sameDay(cell.date, todayDate);
          return (
            <Pressable
              key={i}
              onPress={() => onSelect(cell.date)}
              style={{
                width: `${100 / 7}%`,
                aspectRatio: 1,
                alignItems: 'center',
                justifyContent: 'center',
                padding: 3,
              }}
            >
              <View
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 19,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: isSel ? t.accent : 'transparent',
                  borderWidth: isToday && !isSel ? 1.5 : 0,
                  borderColor: t.accent,
                }}
              >
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: isSel || isToday ? '700' : '500',
                    color: isSel ? '#fff' : !cell.inMonth ? t.textTer : isToday ? t.accent : t.text,
                  }}
                >
                  {cell.day}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
};
