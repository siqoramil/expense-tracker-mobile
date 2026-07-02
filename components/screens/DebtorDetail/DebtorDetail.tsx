import { router } from 'expo-router';
import React, { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { KeyboardAwareScrollView, KeyboardProvider, KeyboardStickyView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { Tokens } from '@/lib/tokens';
import { AppTextInput } from '@/components/AppTextInput';
import { Card, EmptyState, SectionHeader } from '@/components/ui';
import { Icon } from '@/components/Icon';
import { actions, type Debt, useStore } from '@/lib/store';
import { fmtDate, fmtMoney } from '@/lib/format';
import { tStr } from '@/lib/i18n';
import { toast } from '@/lib/toast';

type Props = { t: Tokens; debtor: Debt };

export const DebtorDetail: React.FC<Props> = ({ t, debtor }) => {
  const s = useStore();
  const d = s.debts.find((x) => x.id === debtor.id) || debtor;
  const lang = s.prefs.lang;
  const insets = useSafeAreaInsets();
  const [payOpen, setPayOpen] = useState<boolean>(false);
  const [payAmt, setPayAmt] = useState<string>('');
  const remaining = d.amount - d.paid;
  const pct = Math.min(100, (d.paid / d.amount) * 100);
  const initials = d.name
    .split(' ')
    .map((x) => x[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const addPay = () => {
    const n = Number(payAmt) || 0;
    if (n <= 0) return;
    actions.addPayment(d.id, Math.min(n, remaining));
    setPayAmt('');
    setPayOpen(false);
    toast(tStr(lang, 'saved'));
  };

  const markPaid = () => {
    router.back();
    actions.archiveDebt(d.id);
    toast(tStr(lang, 'paidOff'));
  };

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
      <View style={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 4 }}>
        <Text style={{ fontSize: 13, color: t.textSec, fontWeight: '500', letterSpacing: 0.2 }}>
          {d.direction === 'owe_me' ? tStr(lang, 'oweMe') : tStr(lang, 'iOwe')}
        </Text>
      </View>

      <View style={{ paddingHorizontal: 20, paddingBottom: 18 }}>
        <Card
          t={t}
          style={{
            padding: 20,
            backgroundColor: d.color,
            borderColor: 'transparent',
            alignItems: 'center',
          }}
        >
          <View
            style={{
              width: 64,
              height: 64,
              borderRadius: 32,
              backgroundColor: 'rgba(255,255,255,0.2)',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 10,
            }}
          >
            <Text style={{ fontSize: 22, fontWeight: '700', color: '#fff' }}>{initials}</Text>
          </View>
          <Text
            style={{
              fontSize: 12,
              color: 'rgba(255,255,255,0.85)',
              fontWeight: '600',
              letterSpacing: 0.3,
              marginBottom: 4,
            }}
          >
            {tStr(lang, 'remaining').toUpperCase()}
          </Text>
          <Text style={{ fontSize: 32, fontWeight: '700', color: '#fff', letterSpacing: -1 }}>
            {fmtMoney(remaining, s.prefs.currency)}
          </Text>
          <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 6 }}>
            {tStr(lang, 'paid')} {fmtMoney(d.paid, s.prefs.currency)} /{' '}
            {fmtMoney(d.amount, s.prefs.currency)}
          </Text>
          <View
            style={{
              marginTop: 12,
              height: 6,
              borderRadius: 3,
              backgroundColor: 'rgba(255,255,255,0.2)',
              overflow: 'hidden',
              width: '100%',
            }}
          >
            <View style={{ width: `${pct}%`, height: '100%', backgroundColor: '#fff' }} />
          </View>
        </Card>
      </View>

      <View style={{ paddingHorizontal: 20, paddingBottom: 18, flexDirection: 'row', gap: 10 }}>
        <Pressable
          onPress={() => setPayOpen(true)}
          style={{
            flex: 1,
            padding: 13,
            borderRadius: 14,
            backgroundColor: t.accent,
            alignItems: 'center',
          }}
        >
          <Text style={{ color: '#fff', fontSize: 14, fontWeight: '600' }}>
            {tStr(lang, 'addPayment')}
          </Text>
        </Pressable>
        <Pressable
          onPress={markPaid}
          style={{
            flex: 1,
            padding: 13,
            borderRadius: 14,
            backgroundColor: t.surface,
            borderWidth: 1,
            borderColor: t.border,
            alignItems: 'center',
          }}
        >
          <Text style={{ color: t.text, fontSize: 14, fontWeight: '600' }}>
            {tStr(lang, 'markPaid')}
          </Text>
        </Pressable>
      </View>

      <SectionHeader t={t} title={tStr(lang, 'payments')} />
      <View style={{ paddingHorizontal: 20, paddingBottom: 20 }}>
        {d.payments && d.payments.length > 0 ? (
          <Card t={t} style={{ paddingHorizontal: 16 }}>
            {d.payments.map((p, i, arr) => (
              <View
                key={p.id}
                style={{
                  paddingVertical: 10,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 10,
                  borderBottomWidth: i === arr.length - 1 ? 0 : StyleSheet.hairlineWidth,
                  borderBottomColor: t.divider,
                }}
              >
                <View
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    backgroundColor: t.incomeSoft,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Icon name="check" size={14} color={t.income} stroke={3} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 13.5, fontWeight: '500', color: t.text }}>
                    {tStr(lang, 'addPayment')}
                  </Text>
                  <Text style={{ fontSize: 11.5, color: t.textSec }}>{fmtDate(p.date, lang)}</Text>
                </View>
                <Text style={{ fontSize: 14, fontWeight: '600', color: t.income }}>
                  +{fmtMoney(p.amount, s.prefs.currency)}
                </Text>
              </View>
            ))}
          </Card>
        ) : (
          <Card t={t}>
            <EmptyState
              icon="check"
              title={tStr(lang, 'noPaymentsYet')}
              t={t}
            />
          </Card>
        )}
      </View>

      <SectionHeader t={t} title={tStr(lang, 'note')} />
      <View style={{ paddingHorizontal: 20 }}>
        <Card t={t} style={{ padding: 16 }}>
          <Text style={{ fontSize: 13.5, color: t.text }}>{d.note || '—'}</Text>
          <Text style={{ fontSize: 11.5, color: t.textSec, marginTop: 6 }}>
            {tStr(lang, 'createdLabel')}: {fmtDate(d.created, lang)} ·{' '}
            {tStr(lang, 'dueLabel')}: {fmtDate(d.due, lang)}
            {d.dueTime ? ` · ${d.dueTime}` : ''}
          </Text>
        </Card>
      </View>

      <Modal
        visible={payOpen}
        transparent
        animationType="slide"
        statusBarTranslucent
        onRequestClose={() => setPayOpen(false)}
      >
        <KeyboardProvider statusBarTranslucent navigationBarTranslucent>
          <Pressable
            onPress={() => setPayOpen(false)}
            style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' }}
          >
            <Pressable
              onPress={() => {}}
              style={{
                backgroundColor: t.sheetBg,
                borderTopLeftRadius: 28,
                borderTopRightRadius: 28,
                paddingHorizontal: 20,
                paddingTop: 20,
              }}
            >
              <View
                style={{
                  width: 38,
                  height: 5,
                  borderRadius: 3,
                  backgroundColor: t.borderStrong,
                  alignSelf: 'center',
                  marginBottom: 16,
                }}
              />
              <Text style={{ fontSize: 18, fontWeight: '700', color: t.text, marginBottom: 16 }}>
                {tStr(lang, 'addPayment')}
              </Text>
              <KeyboardAwareScrollView
                bottomOffset={24}
                extraKeyboardSpace={14 + 48 + Math.max(insets.bottom, 16) + 16}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 8 }}
              >
                <AppTextInput
                  autoFocus
                  keyboardType="numeric"
                  value={payAmt}
                  onChangeText={setPayAmt}
                  placeholder="0"
                  placeholderTextColor={t.textTer}
                  style={{
                    padding: 16,
                    borderRadius: 14,
                    backgroundColor: t.surfaceAlt,
                    borderWidth: 1,
                    borderColor: t.border,
                    color: t.text,
                    fontSize: 24,
                    fontWeight: '700',
                    textAlign: 'center',
                  }}
                />
                <Text
                  style={{
                    fontSize: 12,
                    color: t.textSec,
                    textAlign: 'center',
                    marginTop: 6,
                  }}
                >
                  Max: {fmtMoney(remaining, s.prefs.currency)}
                </Text>
              </KeyboardAwareScrollView>
              <KeyboardStickyView
                offset={{ opened: 16 }}
                style={{
                  paddingTop: 14,
                  paddingBottom: Math.max(insets.bottom, 16),
                  backgroundColor: t.sheetBg,
                }}
              >
                <Pressable
                  onPress={addPay}
                  style={{
                    padding: 14,
                    borderRadius: 14,
                    backgroundColor: t.accent,
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ color: '#fff', fontSize: 15, fontWeight: '600' }}>
                    {tStr(lang, 'save')}
                  </Text>
                </Pressable>
              </KeyboardStickyView>
            </Pressable>
          </Pressable>
        </KeyboardProvider>
      </Modal>
    </ScrollView>
  );
};
