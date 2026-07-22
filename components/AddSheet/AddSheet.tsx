import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { Tokens } from '@/lib/tokens';
import { AppTextInput } from '@/components/AppTextInput';
import { CURRENCIES, daysFromNow, isoDate, today } from '@/lib/format';
import { Icon, type IconName } from '@/components/Icon';
import { Button, Field, Input, SegmentedControl } from '@/components/ui';
import { actions, catLabel, type Debt, type Transaction, useStore, walletName } from '@/lib/store';
import { tStr, type Lang } from '@/lib/i18n';
import { toast } from '@/lib/toast';
import { KeyboardAwareScrollView, KeyboardStickyView } from 'react-native-keyboard-controller';
import { DateTimeField } from './DateTimeField/DateTimeField';

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

export const AddSheet = ({ t, mode, editTx, editDebt, onClose }: Props) => {
  const s = useStore();
  const insets = useSafeAreaInsets();
  // Pushed full-screen route (not a formSheet), so the content goes under the
  // status bar — pad the top by the safe-area inset on both platforms.
  const topPad = insets.top + 12;
  // Footer rests above the home indicator; the floor keeps a margin on devices
  // without a bottom inset. Drives footerStyle padding and the sticky offset.
  const footerPaddingBottom = Math.max(insets.bottom, 16);
  const footerHeight = 14 + 54 + footerPaddingBottom; // paddingTop + button + paddingBottom
  // KeyboardAwareScrollView lifts the focused input this far above the keyboard —
  // enough to also clear the Save footer that floats above the keyboard.
  const keyboardBottomOffset = footerHeight + 16;

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

  // Shared form body rendered inside the platform-appropriate scroll container.
  const formBody = (
    <>
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
            <Input
              t={t}
              value={name}
              onChangeText={setName}
              placeholder="John Doe"
            />
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

          <Field t={t} label={tStr(lang, 'note')} style={{ marginTop: 10 }}>
            <Input
              t={t}
              value={note}
              onChangeText={setNote}
              placeholder={tStr(lang, 'noteOptionalPlaceholder')}
            />
          </Field>

          <Field t={t} label={tStr(lang, 'date')} style={{ marginTop: 10 }}>
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
    </>
  );

  // Shared footer buttons rendered inside the platform-appropriate sticky wrapper.
  const footerButtons = (
    <>
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
      <Button
        t={t}
        label={tStr(lang, 'save')}
        onPress={submit}
        size="lg"
        style={{ borderRadius: 16, flex: 1 }}
      />
    </>
  );

  const footerStyle = {
    flexDirection: 'row' as const,
    gap: 10,
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: footerPaddingBottom,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: t.divider,
    backgroundColor: t.sheetBg,
  };

  return (
    <View style={{ flex: 1, backgroundColor: t.sheetBg, paddingTop: topPad }}>
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

      {/* Pushed screen inherits the root <KeyboardProvider>. KeyboardAwareScrollView
          keeps the focused input above the keyboard; KeyboardStickyView makes the
          Save footer ride the keyboard. Works cleanly because this is no longer a
          formSheet (which breaks ScrollView scrolling — lib #726). */}
      <KeyboardAwareScrollView
        bottomOffset={keyboardBottomOffset}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        showsVerticalScrollIndicator={false}
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: footerHeight + 20 }}
      >
        {formBody}
      </KeyboardAwareScrollView>

      {/* opened offset shifts the footer down by the safe-area surplus so the visible
          gap above the keyboard equals the 14px top padding while the keyboard is up. */}
      <KeyboardStickyView offset={{ closed: 0, opened: footerPaddingBottom - 14 }}>
        <View style={footerStyle}>{footerButtons}</View>
      </KeyboardStickyView>
    </View>
  );
};
