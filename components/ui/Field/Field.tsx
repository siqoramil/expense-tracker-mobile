import React from 'react';
import { StyleProp, Text, View, ViewStyle } from 'react-native';
import type { Tokens } from '@/lib/tokens';

export const Field = ({
  t,
  label,
  error,
  helper,
  children,
  style,
}: React.PropsWithChildren<{
  t: Tokens;
  label?: string;
  error?: string | null;
  helper?: string;
  style?: StyleProp<ViewStyle>;
}>) => (
  <View style={style}>
    {label ? (
      <Text
        style={{
          fontSize: 11,
          fontWeight: '700',
          color: t.textSec,
          marginBottom: 7,
          letterSpacing: 0.6,
          textTransform: 'uppercase',
        }}
      >
        {label}
      </Text>
    ) : null}
    {children}
    {error ? (
      <Text style={{ color: t.expense, fontSize: 13, marginTop: 10, fontWeight: '500' }}>
        {error}
      </Text>
    ) : helper ? (
      <Text style={{ color: t.textSec, fontSize: 12, marginTop: 8 }}>{helper}</Text>
    ) : null}
  </View>
);
