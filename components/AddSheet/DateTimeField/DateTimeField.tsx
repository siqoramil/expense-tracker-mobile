import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { Tokens } from '@/lib/tokens';
import { Icon } from '@/components/Icon';
import { ModalBackdrop } from '@/components/Glass';
import { isoDate, today } from '@/lib/format';
import { Calendar } from './Calendar';
import { formatTime, TimePicker } from './TimePicker';

export const parseIsoDate = (iso: string): Date => {
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) return today();
  return new Date(y, m - 1, d);
};

const fmtPickerDate = (iso: string): string => {
  const d = parseIsoDate(iso);
  const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];
  return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
};

export const DateTimeField = ({
  t,
  date,
  time,
  onChangeDate,
  onChangeTime,
}: {
  t: Tokens;
  date: string;
  time: string;
  onChangeDate: (iso: string) => void;
  onChangeTime: (hhmm: string) => void;
}) => {
  const [show, setShow] = useState(false);
  const [draftDate, setDraftDate] = useState<Date>(parseIsoDate(date));
  const [draftTime, setDraftTime] = useState<string>(time);

  const open = () => {
    setDraftDate(parseIsoDate(date));
    setDraftTime(time);
    setShow(true);
  };

  const confirm = () => {
    onChangeDate(isoDate(draftDate));
    onChangeTime(draftTime);
    setShow(false);
  };

  const setNow = () => {
    setDraftDate(today());
    const d = new Date();
    setDraftTime(formatTime(d.getHours(), d.getMinutes()));
  };

  return (
    <>
      <Pressable
        onPress={open}
        style={{
          paddingVertical: 14,
          paddingHorizontal: 16,
          borderRadius: 14,
          backgroundColor: t.surfaceAlt,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: t.border,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Text style={{ color: t.text, fontSize: 15 }}>
          {fmtPickerDate(date)} · {time}
        </Text>
        <Icon name="calendar" size={18} color={t.textSec} stroke={1.8} />
      </Pressable>

      <ModalBackdrop visible={show} onClose={() => setShow(false)} center>
        <Pressable
          onPress={() => {}}
          style={{
            backgroundColor: t.sheetBg,
            borderRadius: 24,
            padding: 18,
            width: '100%',
            maxWidth: 360,
            shadowColor: '#000',
            shadowOpacity: 0.25,
            shadowRadius: 30,
            shadowOffset: { width: 0, height: 12 },
            elevation: 20,
          }}
        >
          <Calendar t={t} value={draftDate} onSelect={setDraftDate} />

          <TimePicker t={t} value={draftTime} onChange={setDraftTime} />

          <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
            <Pressable
              onPress={setNow}
              style={{
                flex: 1,
                paddingVertical: 13,
                borderRadius: 12,
                backgroundColor: t.surfaceAlt,
                alignItems: 'center',
              }}
            >
              <Text style={{ color: t.text, fontSize: 14, fontWeight: '600' }}>Now</Text>
            </Pressable>
            <Pressable
              onPress={confirm}
              style={{
                flex: 1,
                paddingVertical: 13,
                borderRadius: 12,
                backgroundColor: t.accent,
                alignItems: 'center',
                shadowColor: t.accent,
                shadowOpacity: 0.3,
                shadowRadius: 12,
                shadowOffset: { width: 0, height: 4 },
                elevation: 4,
              }}
            >
              <Text style={{ color: '#fff', fontSize: 14, fontWeight: '700' }}>Done</Text>
            </Pressable>
          </View>
        </Pressable>
      </ModalBackdrop>
    </>
  );
};
