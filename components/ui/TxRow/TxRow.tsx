import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { Tokens } from '@/lib/tokens';
import { catLabel, type Category, type Transaction, useStoreSelector } from '@/lib/store';
import { fmtDate } from '@/lib/format';
import { CatIcon } from '../CatIcon/CatIcon';
import { MoneyText } from '../MoneyText/MoneyText';

export const TxRow = ({
  tx,
  t,
  last,
  onPress,
}: {
  tx: Transaction;
  t: Tokens;
  last?: boolean;
  onPress?: (tx: Transaction) => void;
}) => {
  const lang = useStoreSelector((s) => s.prefs.lang);
  const cat = useStoreSelector<Category | undefined>(
    (s) => s.categories.find((c) => c.id === tx.cat),
    (a, b) => a?.id === b?.id && a?.label?.en === b?.label?.en,
  );
  return (
    <Pressable
      onPress={() => onPress?.(tx)}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: last ? 0 : StyleSheet.hairlineWidth,
        borderBottomColor: t.divider,
        gap: 12,
      }}
    >
      <CatIcon cat={tx.cat} size={38} />
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text numberOfLines={1} style={{ fontSize: 15, fontWeight: '500', color: t.text }}>
          {tx.note || catLabel(cat, lang)}
        </Text>
        <Text style={{ fontSize: 12.5, color: t.textSec, marginTop: 2 }}>
          {catLabel(cat, lang)} · {fmtDate(tx.date, lang)}
        </Text>
      </View>
      <MoneyText amount={tx.amount} kind={tx.kind} t={t} />
    </Pressable>
  );
};
