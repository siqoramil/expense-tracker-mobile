import React from 'react';
import { Pressable, StyleProp, ViewStyle } from 'react-native';

export const Press = ({
  onPress,
  children,
  style,
}: React.PropsWithChildren<{ onPress?: () => void; style?: StyleProp<ViewStyle> }>) => (
  <Pressable
    onPress={onPress}
    style={({ pressed }) => [style, pressed && { transform: [{ scale: 0.96 }] }]}
  >
    {children}
  </Pressable>
);
