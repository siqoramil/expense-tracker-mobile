import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { Icon, type IconName } from '@/components/Icon';
import type { Tokens } from '@/lib/tokens';

export const EmptyState = ({
  icon = 'wallet',
  title,
  subtitle,
  t,
}: {
  icon?: IconName;
  title: string;
  subtitle?: string;
  t: Tokens;
}) => {
  // Gentle, continuous float + tiny wiggle so the illustration feels alive.
  const float = useSharedValue(0);
  const twinkle = useSharedValue(0);
  useEffect(() => {
    float.value = withRepeat(
      withTiming(1, { duration: 2600, easing: Easing.inOut(Easing.sin) }),
      -1,
      true,
    );
    twinkle.value = withRepeat(
      withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, [float, twinkle]);
  const illoStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: -6 * float.value }, { rotate: `${(float.value - 0.5) * 5}deg` }],
  }));
  const dotA = useAnimatedStyle(() => ({
    opacity: 0.35 + twinkle.value * 0.55,
    transform: [{ scale: 0.8 + twinkle.value * 0.35 }],
  }));
  const dotB = useAnimatedStyle(() => ({
    opacity: 0.9 - twinkle.value * 0.5,
    transform: [{ scale: 1.15 - twinkle.value * 0.35 }],
  }));
  return (
    <View style={{ paddingVertical: 52, paddingHorizontal: 32, alignItems: 'center' }}>
      {/* Decorative blob + concentric rings (floats + wiggles gently) */}
      <Animated.View
        style={[
          {
            width: 140,
            height: 140,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 24,
          },
          illoStyle,
        ]}
      >
        {/* Outermost faint accent blob */}
        <View
          style={{
            position: 'absolute',
            width: 140,
            height: 140,
            borderRadius: 70,
            backgroundColor: t.accentSoft,
            opacity: 0.3,
          }}
        />
        {/* Middle ring */}
        <View
          style={{
            position: 'absolute',
            width: 108,
            height: 108,
            borderRadius: 54,
            backgroundColor: t.accentSoft,
            opacity: 0.45,
          }}
        />
        {/* Inner ring */}
        <View
          style={{
            position: 'absolute',
            width: 80,
            height: 80,
            borderRadius: 40,
            backgroundColor: t.surfaceAlt,
            borderWidth: 1,
            borderColor: t.borderStrong,
            opacity: 0.7,
          }}
        />
        {/* Icon circle */}
        <View
          style={{
            width: 64,
            height: 64,
            borderRadius: 32,
            backgroundColor: t.surfaceElev,
            borderWidth: StyleSheet.hairlineWidth,
            borderColor: t.borderStrong,
            alignItems: 'center',
            justifyContent: 'center',
            shadowColor: t.accent,
            shadowOpacity: t.dark ? 0.22 : 0.12,
            shadowRadius: 14,
            shadowOffset: { width: 0, height: 4 },
            elevation: 4,
          }}
        >
          <Icon name={icon} size={26} color={t.accent} stroke={1.7} />
        </View>

        {/* floating twinkle dots for a touch of character */}
        <Animated.View
          pointerEvents="none"
          style={[
            {
              position: 'absolute',
              top: 12,
              right: 24,
              width: 10,
              height: 10,
              borderRadius: 5,
              backgroundColor: t.accent,
            },
            dotA,
          ]}
        />
        <Animated.View
          pointerEvents="none"
          style={[
            {
              position: 'absolute',
              bottom: 20,
              left: 20,
              width: 7,
              height: 7,
              borderRadius: 4,
              backgroundColor: t.income,
            },
            dotB,
          ]}
        />
        <Animated.View
          pointerEvents="none"
          style={[
            {
              position: 'absolute',
              top: 34,
              left: 12,
              width: 5,
              height: 5,
              borderRadius: 3,
              backgroundColor: t.expense,
            },
            dotA,
          ]}
        />
      </Animated.View>

      <Text
        style={{
          fontSize: 16,
          fontWeight: '600',
          color: t.text,
          textAlign: 'center',
          letterSpacing: 0.1,
          marginBottom: subtitle ? 6 : 0,
        }}
      >
        {title}
      </Text>
      {subtitle ? (
        <Text
          style={{
            fontSize: 13,
            color: t.textSec,
            textAlign: 'center',
            maxWidth: 230,
            lineHeight: 19,
          }}
        >
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
};
