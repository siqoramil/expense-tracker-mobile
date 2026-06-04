import React, { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { AppTextInput } from '../AppTextInput';
import { fmtDate, fmtMoney } from '../../lib/format';
import { tStr } from '../../lib/i18n';
import { actions, useStore, type Debt } from '../../lib/store';
import { toast } from '../../lib/toast';
import type { Tokens } from '../../lib/tokens';
import { Icon } from '../Icon';
import { Card, EmptyState, ScreenHeader, SectionHeader } from '../ui';

type Props = { t: Tokens; debtor: Debt; onBack: () => void };

export const DebtorDetail: React.FC<Props> = ({ t, debtor, onBack }) => {
  const s = useStore();
  const d = s.debts.find((x) => x.id === debtor.id) || debtor;
  const lang = s.prefs.lang;
  const [payOpen, setPayOpen] = useState(false);
  const [payAmt, setPayAmt] = useState('');
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
    actions.archiveDebt(d.id);
    toast(tStr(lang, 'paidOff'));
    onBack();
  };

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
      <ScreenHeader
        t={t}
        title={d.name}
        subtitle={d.direction === 'owe_me' ? tStr(lang, 'oweMe') : tStr(lang, 'iOwe')}
        onBack={onBack}
      />

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
              title={lang === 'uz' ? 'Hali to‘lovlar yo‘q' : 'No payments yet'}
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
            {lang === 'uz' ? 'Boshlangan' : 'Created'}: {fmtDate(d.created, lang)} ·{' '}
            {lang === 'uz' ? 'Muddati' : 'Due'}: {fmtDate(d.due, lang)}
          </Text>
        </Card>
      </View>

      <Modal
        visible={payOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setPayOpen(false)}
      >
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
              padding: 20,
              paddingBottom: 34,
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
            <Pressable
              onPress={addPay}
              style={{
                marginTop: 16,
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
          </Pressable>
        </Pressable>
      </Modal>
    </ScrollView>
  );
};
