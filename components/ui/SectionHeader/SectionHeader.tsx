import { Text, View } from 'react-native';
import type { Tokens } from '@/lib/tokens';

export const SectionHeader = ({
  title,
  action,
  onAction,
  t,
}: {
  title: string;
  action?: string;
  onAction?: () => void;
  t: Tokens;
}) => (
  <View
    style={{
      flexDirection: 'row',
      alignItems: 'baseline',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      marginBottom: 10,
    }}
  >
    <Text
      style={{
        fontSize: 12.5,
        fontWeight: '600',
        color: t.textSec,
        textTransform: 'uppercase',
        letterSpacing: 0.6,
      }}
    >
      {title}
    </Text>
    {action ? (
      <Text onPress={onAction} style={{ fontSize: 13, color: t.accent, fontWeight: '500' }}>
        {action}
      </Text>
    ) : null}
  </View>
);
