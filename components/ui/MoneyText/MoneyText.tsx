import { StyleProp, Text, TextStyle } from 'react-native';
import type { Tokens } from '@/lib/tokens';
import { type TxKind, useStoreSelector } from '@/lib/store';
import { fmtMoney, unitOf } from '@/lib/format';

export const MoneyText = ({
  amount,
  kind,
  t,
  size = 15,
  mono = true,
}: {
  amount: number;
  kind?: TxKind;
  t: Tokens;
  size?: number;
  mono?: boolean;
}) => {
  const currency = useStoreSelector((s) => s.prefs.currency);
  const up = kind === 'income';
  const color = kind == null ? t.text : up ? t.income : t.expense;
  const sign = kind == null ? '' : up ? '+' : '−';
  const style: StyleProp<TextStyle> = {
    fontFamily: mono ? 'Menlo' : undefined,
    fontSize: size,
    fontWeight: '600',
    color,
    fontVariant: ['tabular-nums'],
  };
  const unit = unitOf(currency);
  return (
    <Text style={style}>
      {sign}
      {fmtMoney(Math.abs(amount), currency)}
      {unit ? <Text style={{ opacity: 0.5, fontSize: size * 0.75 }}> {unit}</Text> : null}
    </Text>
  );
};
