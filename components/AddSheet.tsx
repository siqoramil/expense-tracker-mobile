import React, { useEffect, useMemo, useState } from 'react';
import { Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppTextInput } from './AppTextInput';
import { CURRENCIES, daysFromNow, isoDate, today } from '../lib/format';
import { tStr, type Lang } from '../lib/i18n';
import { actions, catLabel, useStore, walletName, type Debt, type Transaction } from '../lib/store';
import { toast } from '../lib/toast';
import type { Tokens } from '../lib/tokens';
import { ModalBackdrop } from './Glass';
import { Icon, type IconName } from './Icon';
import { KeyboardAwareScrollView, KeyboardStickyView } from 'react-native-keyboard-controller';
import { SegmentedControl } from './ui';

export type AddMode = 'expense' | 'income' | 'debt';

type Props = {
  t: Tokens;
  mode?: AddMode | null;
  editTx?: Transaction | null;
  editDebt?: Debt | null;
  onClose: () => void;
};

type Kind = 'expense' | 'income' | 'debt';

const formatAmountInput = (raw: string): string => {
  if (!raw) return '';
  const [intPart, decPart] = raw.split('.');
  const grouped = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return decPart !== undefined ? `${grouped}.${decPart}` : grouped;
};

export const AddSheet: React.FC<Props> = ({ t, mode, editTx, editDebt, onClose }) => {
  const s = useStore();
  const insets = useSafeAreaInsets();
  // Android formSheet draws under the status bar, so add the safe-area inset.
  // iOS formSheet does NOT go under the status bar, but the sheet's own top
  // has a grabber pill inside the rounded corner (sheetCornerRadius: 32).
  // useSafeAreaInsets() returns top:0 inside an iOS sheet, so insets.top is
  // no help here. A fixed 28px clears the grabber zone and corner radius;
  // 14px was too small and caused the header row to hide behind the grabber.
  const sheetTopPad = Platform.OS === 'android' ? insets.top + 12 : 28;
  const lang = s.prefs.lang;
  const initialKind: Kind = editTx ? editTx.kind : editDebt ? 'debt' : mode || 'expense';

  const [kind, setKind] = useState<Kind>(initialKind);
  const [amount, setAmount] = useState<string>(
    editTx ? String(editTx.amount) : editDebt ? String(editDebt.amount) : '',
  );
  const matchKind = (cKind: string, txKind: 'income' | 'expense' | 'debt') =>
    txKind === 'income' ? cKind === 'income' : cKind === 'expense' || cKind === 'subscription';
  const [cat, setCat] = useState<string>(
    editTx
      ? editTx.cat
      : s.categories.find((c) => !c.hidden && matchKind(c.kind, initialKind))?.id || '',
  );
  const [wallet, setWallet] = useState<string>(
    editTx ? editTx.wallet : s.wallets.find((w) => !w.hidden)?.id || '',
  );
  const [note, setNote] = useState<string>(editTx?.note || editDebt?.note || '');
  const [name, setName] = useState<string>(editDebt?.name || '');
  const [direction, setDirection] = useState<'owe_me' | 'i_owe'>(editDebt?.direction || 'owe_me');
  const [due, setDue] = useState<string>(editDebt?.due || daysFromNow(14));
  const [date, setDate] = useState<string>(editTx?.date || isoDate(today()));
  const nowTime = () => {
    const d = new Date();
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  };
  const [time, setTime] = useState<string>(editTx?.time || nowTime());
  const [dueTime, setDueTime] = useState<string>(editDebt?.dueTime || nowTime());

  const cats = useMemo(
    () => s.categories.filter((c) => !c.hidden && matchKind(c.kind, kind)),

    [s.categories, kind],
  );

  useEffect(() => {
    if (kind !== 'debt') {
      if (!cats.find((c) => c.id === cat)) setCat(cats[0]?.id ?? '');
    }
  }, [kind, cats, cat]);

  const title =
    kind === 'debt'
      ? editDebt
        ? 'Edit debt'
        : tStr(lang, 'newDebt')
      : editTx
        ? `${tStr(lang, 'edit')} ${tStr(lang, kind + '_s').toLowerCase()}`
        : kind === 'income'
          ? tStr(lang, 'addIncome')
          : tStr(lang, 'addExpense');

  const submit = () => {
    const amt = Number(amount) || 0;
    if (amt <= 0) return;
    if (kind === 'debt') {
      if (editDebt) {
        actions.updateDebt(editDebt.id, { name, direction, amount: amt, due, dueTime, note });
      } else {
        const colors = ['#6366F1', '#EC4899', '#10B981', '#F59E0B', '#8B5CF6'];
        actions.addDebt({
          name: name || 'Unnamed',
          direction,
          amount: amt,
          due,
          dueTime,
          note,
          color: colors[Math.floor(Math.random() * colors.length)],
        });
      }
    } else {
      const payload = { kind, cat, wallet, amount: amt, note, date, time };
      if (editTx) actions.updateTx(editTx.id, payload);
      else actions.addTx(payload);
    }
    toast(tStr(lang, 'saved'));
    onClose();
  };

  const handleDelete = () => {
    if (editTx) actions.deleteTx(editTx.id);
    if (editDebt) actions.deleteDebt(editDebt.id);
    toast(tStr(lang, 'deleted'));
    onClose();
  };

  const amtColor = amount
    ? kind === 'income'
      ? t.income
      : kind === 'debt'
        ? t.accent
        : t.expense
    : t.textTer;

  const accentTint =
    kind === 'income' ? t.incomeSoft : kind === 'debt' ? t.accentSoft : t.expenseSoft;

  return (
    <View style={{ flex: 1, backgroundColor: t.sheetBg, paddingTop: sheetTopPad }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 22,
          marginBottom: 18,
        }}
      >
        <Text style={{ fontSize: 22, fontWeight: '700', color: t.text, letterSpacing: -0.5 }}>
          {title}
        </Text>
        <Pressable
          onPress={onClose}
          style={{
            width: 34,
            height: 34,
            borderRadius: 17,
            backgroundColor: t.surfaceAlt,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon name="close" size={16} color={t.textSec} stroke={2.2} />
        </Pressable>
      </View>

      <KeyboardAwareScrollView
        bottomOffset={88}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20 }}
      >
        {!editTx && !editDebt ? (
          <View style={{ marginBottom: 18 }}>
            <SegmentedControl
              t={t}
              value={kind}
              onChange={setKind}
              options={[
                { k: 'expense' as const, label: tStr(lang, 'expense_s') },
                { k: 'income' as const, label: tStr(lang, 'income_s') },
                { k: 'debt' as const, label: tStr(lang, 'debtLabel') },
              ]}
            />
          </View>
        ) : null}

        <View
          style={{
            paddingVertical: 22,
            paddingHorizontal: 20,
            alignItems: 'center',
            borderRadius: 22,
            backgroundColor: accentTint,
            marginBottom: 18,
          }}
        >
          <Text
            style={{
              fontSize: 11,
              color: t.textSec,
              fontWeight: '700',
              letterSpacing: 0.8,
              marginBottom: 10,
            }}
          >
            {tStr(lang, 'amount').toUpperCase()}
          </Text>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'baseline',
              gap: 8,
              justifyContent: 'center',
            }}
          >
            <AppTextInput
              value={formatAmountInput(amount)}
              onChangeText={(v) => setAmount(v.replace(/[^0-9.]/g, ''))}
              placeholder="0"
              placeholderTextColor={t.textTer}
              keyboardType="decimal-pad"
              style={{
                fontSize: 44,
                fontWeight: '800',
                color: amtColor,
                letterSpacing: -1.6,
                textAlign: 'center',
                minWidth: 100,
                padding: 0,
              }}
            />
            <Text style={{ fontSize: 16, color: t.textSec, fontWeight: '600' }}>
              {CURRENCIES[s.prefs.currency].suffix ?? CURRENCIES[s.prefs.currency].symbol}
            </Text>
          </View>
        </View>

        {kind === 'debt' ? (
          <View style={{ gap: 10, marginBottom: 14 }}>
            <SegmentedControl
              t={t}
              value={direction}
              onChange={setDirection}
              options={[
                { k: 'owe_me' as const, label: tStr(lang, 'oweMe') },
                { k: 'i_owe' as const, label: tStr(lang, 'iOwe') },
              ]}
            />
            <Field t={t} label={tStr(lang, 'person')}>
              <Input t={t} value={name} onChangeText={setName} placeholder="John Doe" />
            </Field>
            <Field t={t} label={tStr(lang, 'dueDate')}>
              <DateTimeField
                t={t}
                date={due}
                time={dueTime}
                onChangeDate={setDue}
                onChangeTime={setDueTime}
              />
            </Field>
            <Field t={t} label={tStr(lang, 'note')}>
              <Input
                t={t}
                value={note}
                onChangeText={setNote}
                placeholder={tStr(lang, 'notePlaceholder')}
              />
            </Field>
          </View>
        ) : (
          <>
            <Text
              style={{
                fontSize: 12,
                fontWeight: '600',
                color: t.textSec,
                marginBottom: 8,
                letterSpacing: 0.2,
              }}
            >
              {tStr(lang, 'category').toUpperCase()}
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 14 }}>
              {cats.map((c) => {
                const on = cat === c.id;
                return (
                  <Pressable
                    key={c.id}
                    onPress={() => setCat(c.id)}
                    style={{
                      width: '20%',
                      padding: 4,
                    }}
                  >
                    <View
                      style={{
                        paddingVertical: 10,
                        paddingHorizontal: 4,
                        borderRadius: 14,
                        backgroundColor: on ? c.color + '22' : t.surfaceAlt,
                        borderWidth: 1.5,
                        borderColor: on ? c.color : 'transparent',
                        alignItems: 'center',
                        gap: 5,
                      }}
                    >
                      <Icon name={c.icon as IconName} size={19} color={c.color} stroke={2} />
                      <Text style={{ fontSize: 10, fontWeight: '600', color: t.text }}>
                        {catLabel(c, lang as Lang)}
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>

            <Field t={t} label={tStr(lang, 'wallet')}>
              <View style={{ flexDirection: 'row', gap: 6 }}>
                {s.wallets
                  .filter((w) => !w.hidden)
                  .map((w) => {
                    const on = wallet === w.id;
                    return (
                      <Pressable
                        key={w.id}
                        onPress={() => setWallet(w.id)}
                        style={{
                          flex: 1,
                          padding: 10,
                          borderRadius: 10,
                          backgroundColor: on ? w.color + '22' : t.surfaceAlt,
                          borderWidth: 1.5,
                          borderColor: on ? w.color : 'transparent',
                          flexDirection: 'row',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 6,
                        }}
                      >
                        <Icon name={w.icon as IconName} size={14} color={w.color} />
                        <Text style={{ fontSize: 12, fontWeight: '600', color: t.text }}>
                          {walletName(w, lang)}
                        </Text>
                      </Pressable>
                    );
                  })}
              </View>
            </Field>

            <Field t={t} label={tStr(lang, 'note')} mt={10}>
              <Input
                t={t}
                value={note}
                onChangeText={setNote}
                placeholder={tStr(lang, 'noteOptionalPlaceholder')}
              />
            </Field>

            <Field t={t} label={tStr(lang, 'date')} mt={10}>
              <DateTimeField
                t={t}
                date={date}
                time={time}
                onChangeDate={setDate}
                onChangeTime={setTime}
              />
            </Field>
          </>
        )}
      </KeyboardAwareScrollView>

      <KeyboardStickyView
        offset={{ opened: 20 }}
        style={{
          flexDirection: 'row',
          gap: 10,
          paddingHorizontal: 20,
          paddingTop: 14,
          paddingBottom: 30,
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: t.divider,
          backgroundColor: t.sheetBg,
        }}
      >
        {editTx || editDebt ? (
          <Pressable
            onPress={handleDelete}
            style={{
              width: 54,
              height: 54,
              borderRadius: 16,
              backgroundColor: t.expenseSoft,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon name="close" size={20} color={t.expense} stroke={2.5} />
          </Pressable>
        ) : null}
        <Pressable
          onPress={submit}
          style={({ pressed }) => [
            {
              flex: 1,
              height: 54,
              borderRadius: 16,
              backgroundColor: t.accent,
              alignItems: 'center',
              justifyContent: 'center',
              shadowColor: t.accent,
              shadowOpacity: 0.35,
              shadowRadius: 16,
              shadowOffset: { width: 0, height: 6 },
              elevation: 6,
            },
            pressed && { transform: [{ scale: 0.98 }], shadowOpacity: 0.2 },
          ]}
        >
          <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700', letterSpacing: 0.2 }}>
            {tStr(lang, 'save')}
          </Text>
        </Pressable>
      </KeyboardStickyView>
    </View>
  );
};

const Field: React.FC<{ t: Tokens; label: string; children: React.ReactNode; mt?: number }> = ({
  t,
  label,
  children,
  mt,
}) => (
  <View style={{ marginTop: mt }}>
    <Text
      style={{
        fontSize: 11,
        fontWeight: '700',
        color: t.textSec,
        marginBottom: 7,
        letterSpacing: 0.6,
      }}
    >
      {label.toUpperCase()}
    </Text>
    {children}
  </View>
);

const Input: React.FC<{
  t: Tokens;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
}> = ({ t, value, onChangeText, placeholder }) => (
  <AppTextInput
    value={value}
    onChangeText={onChangeText}
    placeholder={placeholder}
    placeholderTextColor={t.textTer}
    style={{
      paddingVertical: 14,
      paddingHorizontal: 16,
      borderRadius: 14,
      backgroundColor: t.surfaceAlt,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: t.border,
      color: t.text,
      fontSize: 15,
    }}
  />
);

const parseIsoDate = (iso: string): Date => {
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

const Calendar: React.FC<{
  t: Tokens;
  value: Date;
  onSelect: (d: Date) => void;
}> = ({ t, value, onSelect }) => {
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

const parseTime = (hhmm: string): { h: number; m: number } => {
  const [hStr, mStr] = (hhmm || '12:00').split(':');
  const h = Math.max(0, Math.min(23, Number(hStr) || 0));
  const m = Math.max(0, Math.min(59, Number(mStr) || 0));
  return { h, m };
};
const formatTime = (h: number, m: number) =>
  `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;

const TimePicker: React.FC<{
  t: Tokens;
  value: string;
  onChange: (hhmm: string) => void;
}> = ({ t, value, onChange }) => {
  const { h, m } = parseTime(value);

  const Stepper: React.FC<{
    label: string;
    value: number;
    max: number;
    onChange: (v: number) => void;
  }> = ({ label, value, max, onChange }) => (
    <View style={{ alignItems: 'center', flex: 1 }}>
      <Text style={{ fontSize: 11, color: t.textTer, fontWeight: '600', letterSpacing: 0.3 }}>
        {label}
      </Text>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
          marginTop: 6,
        }}
      >
        <Pressable
          onPress={() => onChange((value - 1 + (max + 1)) % (max + 1))}
          hitSlop={8}
          style={{
            width: 32,
            height: 32,
            borderRadius: 16,
            backgroundColor: t.surfaceAlt,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon name="chevron-left" size={16} color={t.text} stroke={2.4} />
        </Pressable>
        <Text
          style={{
            fontSize: 22,
            fontWeight: '700',
            color: t.text,
            minWidth: 38,
            textAlign: 'center',
            letterSpacing: -0.3,
          }}
        >
          {String(value).padStart(2, '0')}
        </Text>
        <Pressable
          onPress={() => onChange((value + 1) % (max + 1))}
          hitSlop={8}
          style={{
            width: 32,
            height: 32,
            borderRadius: 16,
            backgroundColor: t.surfaceAlt,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon name="chevron-right" size={16} color={t.text} stroke={2.4} />
        </Pressable>
      </View>
    </View>
  );

  return (
    <View
      style={{
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: t.divider,
        flexDirection: 'row',
        alignItems: 'center',
      }}
    >
      <Stepper label="HOUR" value={h} max={23} onChange={(v) => onChange(formatTime(v, m))} />
      <Text
        style={{
          fontSize: 22,
          fontWeight: '700',
          color: t.textTer,
          marginTop: 18,
        }}
      >
        :
      </Text>
      <Stepper label="MINUTE" value={m} max={59} onChange={(v) => onChange(formatTime(h, v))} />
    </View>
  );
};

const DateTimeField: React.FC<{
  t: Tokens;
  date: string;
  time: string;
  onChangeDate: (iso: string) => void;
  onChangeTime: (hhmm: string) => void;
}> = ({ t, date, time, onChangeDate, onChangeTime }) => {
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

      <Modal visible={show} transparent animationType="fade" onRequestClose={() => setShow(false)}>
        <ModalBackdrop>
          <Pressable
            onPress={() => setShow(false)}
            style={{
              flex: 1,
              justifyContent: 'center',
              alignItems: 'center',
              padding: 20,
            }}
          >
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
          </Pressable>
        </ModalBackdrop>
      </Modal>
    </>
  );
};
