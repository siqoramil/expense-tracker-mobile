import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  type LayoutChangeEvent,
  Platform,
  Pressable,
  type StyleProp,
  StyleSheet,
  View,
  type ViewStyle,
  useWindowDimensions,
} from 'react-native';
import Reanimated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import type { Lang } from '../lib/i18n';
import type { Tokens } from '../lib/tokens';
import { Icon, type IconName } from './Icon';

// Liquid Glass (iOS 26+) is optional — probe lazily so a missing native module
// or older OS never throws. The active-tab pill renders as real Liquid Glass
// where available and falls back to a translucent accent pill everywhere else
// (Android, older iOS), so the sliding selection works on every platform.
type GlassMod = {
  GlassView: React.ComponentType<{
    glassEffectStyle?: 'clear' | 'regular' | 'none';
    tintColor?: string;
    isInteractive?: boolean;
    colorScheme?: 'auto' | 'light' | 'dark';
    style?: StyleProp<ViewStyle>;
    children?: React.ReactNode;
  }>;
  GlassContainer: React.ComponentType<{
    spacing?: number;
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

export type TabKey = 'home' | 'stats' | 'debtors' | 'profile';

const BAR_H = 60;
const BAR_MARGIN_H = 16;
const FAB_SIZE = 60;
const FAB_LIFT = 34;
const NOTCH_R = 42;
const NOTCH_D = 32;
const NOTCH_EASE = 20;

const buildBarPath = (W: number, H: number) => {
  const r = H / 2;
  const c = W / 2;
  return [
    `M ${r} 0`,
    `L ${c - NOTCH_R - NOTCH_EASE} 0`,
    `C ${c - NOTCH_R} 0 ${c - NOTCH_R} ${NOTCH_D} ${c} ${NOTCH_D}`,
    `C ${c + NOTCH_R} ${NOTCH_D} ${c + NOTCH_R} 0 ${c + NOTCH_R + NOTCH_EASE} 0`,
    `L ${W - r} 0`,
    `A ${r} ${r} 0 0 1 ${W} ${r}`,
    `L ${W} ${H - r}`,
    `A ${r} ${r} 0 0 1 ${W - r} ${H}`,
    `L ${r} ${H}`,
    `A ${r} ${r} 0 0 1 0 ${H - r}`,
    `L 0 ${r}`,
    `A ${r} ${r} 0 0 1 ${r} 0`,
    `Z`,
  ].join(' ');
};

export const TabBar: React.FC<{
  active: TabKey;
  onChange: (k: TabKey) => void;
  onFab: () => void;
  t: Tokens;
  lang: Lang;
}> = ({ active, onChange, onFab, t }) => {
  const insets = useSafeAreaInsets();
  const { width: SCREEN_W } = useWindowDimensions();
  const BAR_W = SCREEN_W - BAR_MARGIN_H * 2;
  const tabs: { k: TabKey; icon: IconName; iconFill: IconName }[] = [
    { k: 'home', icon: 'home', iconFill: 'home-fill' },
    { k: 'stats', icon: 'chart', iconFill: 'chart-fill' },
    { k: 'debtors', icon: 'users', iconFill: 'users-fill' },
    { k: 'profile', icon: 'user', iconFill: 'user-fill' },
  ];
  // With the system nav bar hidden (immersive), insets.bottom collapses toward
  // 0 and the bar would sit flush to the screen edge — keep a floor so it stays
  // lifted on both gesture-nav and immersive devices. On iOS the home-indicator
  // inset lifts the bar higher than desired, so trim it to sit lower.
  const bottomPad =
    Platform.OS === 'ios' ? Math.max(insets.bottom - 22, 4) : Math.max(insets.bottom, 18);

  // Liquid-glass selection pill: tracks the active tab's measured frame and
  // springs between tabs for the fluid iOS morph. Positions are measured via
  // onLayout so the FAB notch / variable tab widths never need hardcoding.
  const PILL_H = 40;
  const PILL_INSET = 8;
  const layouts = useRef<Partial<Record<TabKey, { x: number; w: number }>>>({});
  const px = useSharedValue(0);
  const pw = useSharedValue(0);
  const ready = useSharedValue(0);

  const moveTo = (k: TabKey, animate: boolean) => {
    const l = layouts.current[k];
    if (!l) return;
    const targetX = l.x + PILL_INSET;
    const targetW = Math.max(l.w - PILL_INSET * 2, 0);
    if (animate && ready.value === 1) {
      const spring = { damping: 18, stiffness: 200, mass: 0.6 };
      px.value = withSpring(targetX, spring);
      pw.value = withSpring(targetW, spring);
    } else {
      px.value = targetX;
      pw.value = targetW;
      ready.value = 1;
    }
  };

  const onTabLayout = (k: TabKey, e: LayoutChangeEvent) => {
    const { x, width } = e.nativeEvent.layout;
    layouts.current[k] = { x, w: width };
    if (k === active) moveTo(k, false);
  };

  useEffect(() => {
    moveTo(active, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  const pillStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: px.value }],
    width: pw.value,
    opacity: ready.value,
  }));

  const pillBase: ViewStyle = {
    position: 'absolute',
    top: (BAR_H - PILL_H) / 2,
    left: 0,
    height: PILL_H,
    borderRadius: PILL_H / 2,
    overflow: 'hidden',
  };

  return (
    <View
      pointerEvents="box-none"
      style={{
        position: 'absolute',
        bottom: bottomPad,
        left: BAR_MARGIN_H,
        right: BAR_MARGIN_H,
        height: BAR_H,
      }}
    >
      {HAS_LIQUID_GLASS && glassMod ? (
        <View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: BAR_H,
            borderRadius: BAR_H / 2,
            shadowColor: '#000',
            shadowOpacity: t.dark ? 0.4 : 0.12,
            shadowRadius: 16,
            shadowOffset: { width: 0, height: 8 },
          }}
        >
          <glassMod.GlassContainer
            style={[StyleSheet.absoluteFill, { borderRadius: BAR_H / 2 }]}
            spacing={40}
          >
            <glassMod.GlassView
              style={[StyleSheet.absoluteFill, { borderRadius: BAR_H / 2 }]}
              glassEffectStyle="regular"
              colorScheme={t.dark ? 'dark' : 'light'}
            />
            <Reanimated.View pointerEvents="none" style={[pillBase, pillStyle]}>
              <glassMod.GlassView
                style={[StyleSheet.absoluteFill, { borderRadius: PILL_H / 2 }]}
                glassEffectStyle="clear"
                tintColor={t.accent}
                isInteractive
                colorScheme={t.dark ? 'dark' : 'light'}
              />
            </Reanimated.View>
          </glassMod.GlassContainer>
        </View>
      ) : (
        <>
          <View
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: BAR_H,
              shadowColor: '#000',
              shadowOpacity: t.dark ? 0.45 : 0.14,
              shadowRadius: 22,
              shadowOffset: { width: 0, height: 10 },
              elevation: 12,
            }}
          >
            <Svg width={BAR_W} height={BAR_H} pointerEvents="none">
              <Path
                d={buildBarPath(BAR_W - 2, BAR_H - 2)}
                transform="translate(1,1)"
                fill={t.tabBg}
                stroke={t.tabBorder}
                strokeWidth={1}
              />
            </Svg>
          </View>
          <Reanimated.View pointerEvents="none" style={[pillBase, pillStyle]}>
            <View
              style={[StyleSheet.absoluteFill, { backgroundColor: t.accentSoft }]}
            />
          </Reanimated.View>
        </>
      )}

      <View
        style={{
          height: BAR_H,
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 8,
        }}
      >
        {tabs.slice(0, 2).map((tab) => (
          <TabItem
            key={tab.k}
            tab={tab}
            active={active === tab.k}
            onPress={() => onChange(tab.k)}
            onLayout={(e) => onTabLayout(tab.k, e)}
            t={t}
          />
        ))}
        <View style={{ width: NOTCH_R * 2 + NOTCH_EASE * 2 - 16 }} />
        {tabs.slice(2).map((tab) => (
          <TabItem
            key={tab.k}
            tab={tab}
            active={active === tab.k}
            onPress={() => onChange(tab.k)}
            onLayout={(e) => onTabLayout(tab.k, e)}
            t={t}
          />
        ))}
      </View>

      <View
        pointerEvents="box-none"
        style={{
          position: 'absolute',
          top: -FAB_LIFT,
          left: 0,
          right: 0,
          alignItems: 'center',
        }}
      >
        <FabButton onPress={onFab} t={t} />
      </View>
    </View>
  );
};

const FabButton: React.FC<{ onPress: () => void; t: Tokens }> = ({ onPress, t }) => {
  // Continuous "water" ripple: rings keep emanating from the FAB, expanding and
  // fading on a slow loop. Three rings, evenly offset by a third of the period,
  // so multiple ripples are always expanding at once — a continuous water wave.
  const waves = React.useRef([0, 1, 2].map(() => new Animated.Value(0))).current;

  React.useEffect(() => {
    const DURATION = 2800;
    const stagger = DURATION / waves.length;
    const loops = waves.map((v) =>
      Animated.loop(
        Animated.timing(v, {
          toValue: 1,
          duration: DURATION,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ),
    );
    const timers = loops.map((l, i) => setTimeout(() => l.start(), i * stagger));
    return () => {
      timers.forEach(clearTimeout);
      loops.forEach((l) => l.stop());
    };
  }, [waves]);

  const ring = (v: Animated.Value) => ({
    opacity: v.interpolate({ inputRange: [0, 0.06, 0.9, 1], outputRange: [0, 0.26, 0, 0] }),
    transform: [{ scale: v.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1.55] }) }],
  });

  return (
    <View style={{ alignItems: 'center', justifyContent: 'center' }}>
      {waves.map((v, i) => (
        <Animated.View
          key={i}
          pointerEvents="none"
          style={[
            { position: 'absolute', width: FAB_SIZE, height: FAB_SIZE, borderRadius: FAB_SIZE / 2, backgroundColor: t.accent },
            ring(v),
          ]}
        />
      ))}
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          {
            width: FAB_SIZE,
            height: FAB_SIZE,
            borderRadius: FAB_SIZE / 2,
            backgroundColor: t.accent,
            alignItems: 'center',
            justifyContent: 'center',
            shadowColor: '#0F1729',
            shadowOpacity: 0.22,
            shadowRadius: 14,
            shadowOffset: { width: 0, height: 8 },
            elevation: 14,
            overflow: 'hidden',
          },
          pressed && { transform: [{ scale: 0.92 }] },
        ]}
      >
        <View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFill,
            { borderRadius: FAB_SIZE / 2, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.45)' },
          ]}
        />
        <Icon name="plus" size={26} color="#fff" stroke={2.5} />
      </Pressable>
    </View>
  );
};

const TabItem: React.FC<{
  tab: { k: TabKey; icon: IconName; iconFill: IconName };
  active: boolean;
  onPress: () => void;
  onLayout: (e: LayoutChangeEvent) => void;
  t: Tokens;
}> = ({ tab, active, onPress, onLayout, t }) => (
  <Pressable
    onPress={onPress}
    onLayout={onLayout}
    style={({ pressed }) => [
      {
        flex: 1,
        height: '100%',
        alignItems: 'center',
        justifyContent: 'center',
      },
      pressed && { opacity: 0.55 },
    ]}
  >
    <Icon
      name={active ? tab.iconFill : tab.icon}
      size={22}
      color={active ? t.accent : t.textSec}
      stroke={2}
    />
  </Pressable>
);
