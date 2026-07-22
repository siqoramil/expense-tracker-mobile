import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Icon, type IconName } from '@/components/Icon';
import type { Tokens } from '@/lib/tokens';

export const IconButton = ({
  icon,
  onPress,
  t,
  badge,
}: {
  icon: IconName;
  onPress?: () => void;
  t: Tokens;
  badge?: number;
}) => (
  <Pressable
    onPress={onPress}
    style={{
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: t.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: t.border,
      alignItems: 'center',
      justifyContent: 'center',
    }}
  >
    <Icon name={icon} size={18} color={t.textSec} />
    {badge && badge > 0 ? (
      <View
        style={{
          position: 'absolute',
          top: 2,
          right: 2,
          minWidth: 16,
          height: 16,
          borderRadius: 8,
          backgroundColor: t.expense,
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: 4,
          borderWidth: 1.5,
          borderColor: t.surface,
        }}
      >
        <Text style={{ color: '#fff', fontSize: 10, fontWeight: '700' }}>{badge}</Text>
      </View>
    ) : null}
  </Pressable>
);
