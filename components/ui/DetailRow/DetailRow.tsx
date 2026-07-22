import { StyleSheet, Text, View } from 'react-native';
import type { Tokens } from '@/lib/tokens';

export const DetailRow = ({
  t,
  label,
  value,
  last,
}: {
  t: Tokens;
  label: string;
  value: string;
  last?: boolean;
}) => (
  <View
    style={{
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 13,
      borderBottomWidth: last ? 0 : StyleSheet.hairlineWidth,
      borderBottomColor: t.divider,
    }}
  >
    <Text style={{ fontSize: 13.5, color: t.textSec, flex: 1 }}>{label}</Text>
    <Text style={{ fontSize: 14, fontWeight: '500', color: t.text }}>{value}</Text>
  </View>
);
