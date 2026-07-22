import React from 'react';
import { Pressable, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import type { Tokens } from '@/lib/tokens';

// Liquid Glass (iOS 26+) for the active SegmentedControl pill — optional, probed
// lazily so a missing native module or older OS never throws. Falls back to a
// solid surface pill everywhere else (Android, older iOS).
type SegGlass = {
  GlassView: React.ComponentType<{
    glassEffectStyle?: 'clear' | 'regular' | 'none';
    tintColor?: string;
    colorScheme?: 'auto' | 'light' | 'dark';
    style?: StyleProp<ViewStyle>;
  }>;
  isLiquidGlassAvailable?: () => boolean;
};
let segGlass: SegGlass | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  segGlass = require('expo-glass-effect') as SegGlass;
} catch {
  segGlass = null;
}
const HAS_SEG_GLASS = Boolean(segGlass?.GlassView && segGlass.isLiquidGlassAvailable?.());

export const SegmentedControl = <K extends string>({
  options,
  value,
  onChange,
  t,
}: {
  options: { k: K; label: string }[];
  value: K;
  onChange: (k: K) => void;
  t: Tokens;
}) => (
  <View
    style={{
      flexDirection: 'row',
      gap: 4,
      padding: 4,
      borderRadius: 12,
      backgroundColor: t.surfaceAlt,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: t.border,
    }}
  >
    {options.map((opt) => {
      const on = value === opt.k;
      return (
        <Pressable
          key={opt.k}
          onPress={() => onChange(opt.k)}
          style={{
            flex: 1,
            paddingVertical: 8,
            paddingHorizontal: 12,
            borderRadius: 9,
            overflow: 'hidden',
            backgroundColor: on && !HAS_SEG_GLASS ? t.surface : 'transparent',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {on && HAS_SEG_GLASS && segGlass ? (
            <segGlass.GlassView
              style={[StyleSheet.absoluteFill, { borderRadius: 9 }]}
              glassEffectStyle="regular"
              colorScheme={t.dark ? 'dark' : 'light'}
            />
          ) : null}
          <Text
            style={{
              color: on ? t.text : t.textSec,
              fontWeight: on ? '600' : '500',
              fontSize: 13,
            }}
          >
            {opt.label}
          </Text>
        </Pressable>
      );
    })}
  </View>
);
