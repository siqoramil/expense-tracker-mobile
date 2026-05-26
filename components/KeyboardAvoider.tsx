import React from 'react';
import { StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedKeyboard, useAnimatedStyle } from 'react-native-reanimated';

type AvoiderProps = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  extra?: number;
};

export const KeyboardAvoider: React.FC<AvoiderProps> = ({ children, style, extra = 0 }) => {
  const keyboard = useAnimatedKeyboard();
  const animatedStyle = useAnimatedStyle(() => {
    const h = keyboard.height.value;
    return { paddingBottom: h > 0 ? h + extra : 0 };
  });
  return <Animated.View style={[styles.fill, style, animatedStyle]}>{children}</Animated.View>;
};

export const KeyboardSpacer: React.FC<{ extra?: number }> = ({ extra = 0 }) => {
  const keyboard = useAnimatedKeyboard();
  const animatedStyle = useAnimatedStyle(() => {
    const h = keyboard.height.value;
    return { height: h > 0 ? h + extra : 0 };
  });
  return <Animated.View style={animatedStyle} />;
};

const styles = StyleSheet.create({
  fill: { flex: 1 },
});
