import React from 'react';
import { Platform, Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { Tokens } from '@/lib/tokens';
import { Icon } from '@/components/Icon';

// Height of the title row itself (below the status-bar/notch inset).
const HEADER_TITLE_H = 56;

// Breathing room between the status-bar/notch inset and the title row so the
// large title doesn't tuck right against the clock.
const HEADER_TOP_GAP = 10;

// Gap below the floating bar so scroll content doesn't tuck against the title.
// Applied to content padding only — the bar's own height stays unchanged.
const HEADER_CONTENT_GAP = 12;

// Probe expo-glass-effect lazily so a missing native module never throws.
type GlassMod = {
  GlassView: React.ComponentType<{
    glassEffectStyle?: 'clear' | 'regular' | 'none';
    colorScheme?: 'auto' | 'light' | 'dark';
    style?: StyleProp<ViewStyle>;
    children?: React.ReactNode;
  }>;
  isLiquidGlassAvailable?: () => boolean;
};
let glassMod: GlassMod | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  glassMod = require('expo-glass-effect') as GlassMod;
} catch {
  glassMod = null;
}
const HAS_LIQUID_GLASS = Boolean(glassMod?.GlassView && glassMod.isLiquidGlassAvailable?.());

// Probe expo-blur lazily for the iOS < 26 fallback.
type BlurMod = {
  BlurView: React.ComponentType<{
    tint?: string;
    intensity?: number;
    style?: StyleProp<ViewStyle>;
    children?: React.ReactNode;
  }>;
};
let blurMod: BlurMod | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  blurMod = require('expo-blur') as BlurMod;
} catch {
  blurMod = null;
}

// Padding a ScrollView needs so its content starts just below the floating bar,
// plus a small gap so the first item doesn't tuck against the large title.
export const useTabHeaderHeight = () => {
  const insets = useSafeAreaInsets();
  if (Platform.OS !== 'ios') return 0;
  return insets.top + HEADER_TOP_GAP + HEADER_TITLE_H + HEADER_CONTENT_GAP;
};

// Large-title header for tab screens. No navigator draws a header for tabs on
// either platform, so each tab supplies its own title. The "+" action is shown
// only on iOS — on Android the custom FAB tab bar already provides add.
//
// On iOS: renders as a fixed floating bar with Liquid Glass (iOS 26+) or
// BlurView fallback (iOS < 26). Content scrolls under it via useTabHeaderHeight.
// On Android: in-flow plain View, no positioning change.
export const TabHeader: React.FC<{ t: Tokens; title: string; onAdd?: () => void }> = ({
  t,
  title,
  onAdd,
}) => {
  const insets = useSafeAreaInsets();

  if (Platform.OS !== 'ios') {
    // Android: unchanged in-flow plain header.
    return (
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 20,
          paddingTop: 4,
          paddingBottom: 10,
        }}
      >
        <Text style={{ fontSize: 30, fontWeight: '700', color: t.text, letterSpacing: -0.6 }}>
          {title}
        </Text>
      </View>
    );
  }

  // iOS: floating bar spanning from screen top through title row.
  const barHeight = insets.top + HEADER_TOP_GAP + HEADER_TITLE_H;

  const titleRow = (
    <View
      style={{
        height: HEADER_TITLE_H,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
      }}
    >
      <Text style={{ fontSize: 30, fontWeight: '700', color: t.text, letterSpacing: -0.6 }}>
        {title}
      </Text>
      {onAdd ? (
        <Pressable
          onPress={onAdd}
          hitSlop={10}
          style={({ pressed }) => ({
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: t.accent,
            alignItems: 'center',
            justifyContent: 'center',
            shadowColor: t.accent,
            shadowOpacity: 0.3,
            shadowRadius: 10,
            shadowOffset: { width: 0, height: 4 },
            transform: [{ scale: pressed ? 0.94 : 1 }],
          })}
        >
          <Icon name="plus" size={22} color="#fff" stroke={2.5} />
        </Pressable>
      ) : null}
    </View>
  );

  const floatBase: ViewStyle = {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: barHeight,
    zIndex: 100,
  };

  if (HAS_LIQUID_GLASS && glassMod) {
    // iOS 26+: real Liquid Glass bar.
    return (
      <View style={floatBase} pointerEvents="box-none">
        <glassMod.GlassView
          style={StyleSheet.absoluteFill}
          glassEffectStyle="regular"
          colorScheme={t.dark ? 'dark' : 'light'}
        />
        <View style={{ height: insets.top + HEADER_TOP_GAP }} />
        {titleRow}
      </View>
    );
  }

  if (blurMod) {
    // iOS < 26: BlurView material fallback.
    return (
      <View
        style={[floatBase, { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: t.divider }]}
        pointerEvents="box-none"
      >
        <blurMod.BlurView
          tint={t.dark ? 'systemChromeMaterialDark' : 'systemChromeMaterialLight'}
          intensity={85}
          style={StyleSheet.absoluteFill}
        />
        <View style={{ height: insets.top + HEADER_TOP_GAP }} />
        {titleRow}
      </View>
    );
  }

  // Ultimate fallback: opaque bar (expo-blur not available in this build).
  return (
    <View
      style={[floatBase, { backgroundColor: t.bg, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: t.divider }]}
      pointerEvents="box-none"
    >
      <View style={{ height: insets.top + HEADER_TOP_GAP }} />
      {titleRow}
    </View>
  );
};
