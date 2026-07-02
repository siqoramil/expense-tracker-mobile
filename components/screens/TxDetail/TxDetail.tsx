import { router } from 'expo-router';
import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import type { Tokens } from '@/lib/tokens';
import { Card, DetailRow } from '@/components/ui';
import { Icon } from '@/components/Icon';
import { actions, catLabel, type Transaction, useStore, walletName } from '@/lib/store';
import { fmtDate, fmtMoney, unitOf } from '@/lib/format';
import { tStr } from '@/lib/i18n';
import { toast } from '@/lib/toast';

type Props = {
  t: Tokens;
  tx: Transaction;
  onEdit: (tx: Transaction) => void;
};

export const TxDetail: React.FC<Props> = ({ t, tx, onEdit }) => {
  const s = useStore();
  const lang = s.prefs.lang;
  const cat = s.categories.find((c) => c.id === tx.cat);
  const w = s.wallets.find((x) => x.id === tx.wallet);
  const up = tx.kind === 'income';

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
      <View style={{ paddingHorizontal: 20, paddingBottom: 18, alignItems: 'center' }}>
        <Text
          style={{
            fontSize: 12,
            color: t.textSec,
            fontWeight: '600',
            letterSpacing: 0.3,
            marginBottom: 4,
          }}
        >
          {tStr(lang, up ? 'income' : 'expenses').toUpperCase()}
        </Text>
        <Text
          style={{
            fontSize: 40,
            fontWeight: '700',
            color: up ? t.income : t.expense,
            letterSpacing: -1.2,
          }}
        >
          {(up ? '+' : '−') + fmtMoney(tx.amount, s.prefs.currency)}
        </Text>
        <Text style={{ fontSize: 13, color: t.textSec, marginTop: 2 }}>
          {unitOf(s.prefs.currency) || s.prefs.currency}
        </Text>
      </View>
      <View style={{ paddingHorizontal: 20, paddingBottom: 14 }}>
        <Card t={t} style={{ paddingHorizontal: 16 }}>
          <DetailRow t={t} label={tStr(lang, 'note')} value={tx.note || '—'} />
          <DetailRow t={t} label={tStr(lang, 'category')} value={catLabel(cat, lang)} />
          <DetailRow t={t} label={tStr(lang, 'wallet')} value={walletName(w, lang)} />
          <DetailRow
            t={t}
            label={tStr(lang, 'date')}
            value={`${fmtDate(tx.date, lang)}${tx.time ? ` · ${tx.time}` : ''}`}
            last
          />
        </Card>
      </View>
      <View style={{ paddingHorizontal: 20, flexDirection: 'row', gap: 10 }}>
        <Pressable
          onPress={() => onEdit(tx)}
          style={{
            flex: 1,
            padding: 14,
            borderRadius: 14,
            backgroundColor: t.surface,
            borderWidth: 1,
            borderColor: t.border,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
          }}
        >
          <Icon name="settings" size={14} color={t.text} />
          <Text style={{ color: t.text, fontSize: 15, fontWeight: '600' }}>
            {tStr(lang, 'edit')}
          </Text>
        </Pressable>
        <Pressable
          onPress={() => {
            router.back();
            actions.deleteTx(tx.id);
            toast(tStr(lang, 'deleted'));
          }}
          style={{
            flex: 1,
            padding: 14,
            borderRadius: 14,
            backgroundColor: t.expenseSoft,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ color: t.expense, fontSize: 15, fontWeight: '600' }}>
            {tStr(lang, 'delete')}
          </Text>
        </Pressable>
      </View>
    </ScrollView>
  );
};
