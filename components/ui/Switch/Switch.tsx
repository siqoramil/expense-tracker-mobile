import { useEffect } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import type { Tokens } from '@/lib/tokens';

export const Switch = ({
  on,
  onChange,
  t,
}: {
  on: boolean;
  onChange: (v: boolean) => void;
  t: Tokens;
}) => {
  const progress = useSharedValue(on ? 1 : 0);

  useEffect(() => {
    progress.value = withTiming(on ? 1 : 0, { duration: 260 });
  }, [on, progress]);

  const trackStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(progress.value, [0, 1], [t.surfaceAlt, t.accent]),
    borderColor: interpolateColor(progress.value, [0, 1], [t.borderStrong, t.accent]),
  }));

  const thumbStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateX: withSpring(on ? 22 : 2, {
          damping: 18,
          stiffness: 220,
          mass: 0.6,
        }),
      },
    ],
  }));

  return (
    <Pressable onPress={() => onChange(!on)}>
      <Animated.View
        style={[
          {
            width: 48,
            height: 28,
            borderRadius: 14,
            borderWidth: StyleSheet.hairlineWidth,
            justifyContent: 'center',
          },
          trackStyle,
        ]}
      >
        <Animated.View
          style={[
            {
              position: 'absolute',
              top: 2,
              left: 0,
              width: 22,
              height: 22,
              borderRadius: 11,
              backgroundColor: '#fff',
              shadowColor: '#000',
              shadowOpacity: 0.15,
              shadowRadius: 4,
              shadowOffset: { width: 0, height: 2 },
              elevation: 2,
            },
            thumbStyle,
          ]}
        />
      </Animated.View>
    </Pressable>
  );
};
