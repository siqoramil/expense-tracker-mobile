import React from 'react';
import { Pressable, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import type { Tokens } from '@/lib/tokens';

export const Card = ({
  children,
  style,
  t,
  onPress,
}: React.PropsWithChildren<{ style?: StyleProp<ViewStyle>; t: Tokens; onPress?: () => void }>) => {
  const s: StyleProp<ViewStyle> = [
    {
      backgroundColor: t.surface,
      borderRadius: 20,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: t.border,
    },
    style,
  ];
  if (onPress) {
    return (
      <Pressable onPress={onPress} style={s}>
        {children}
      </Pressable>
    );
  }
  return <View style={s}>{children}</View>;
};
