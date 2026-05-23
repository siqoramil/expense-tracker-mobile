import { requireOptionalNativeModule } from 'expo-modules-core';
import React from 'react';
import { Platform, StyleProp, StyleSheet, View, type ViewStyle } from 'react-native';

// ── Feature detection (module-eval) ────────────────────────────────
// Three tiers, all probed lazily so a missing native module never
// throws at import time:
//   1. expo-glass-effect / GlassView → iOS 26 Liquid Glass (real
//      refraction, specular highlights, interactive lensing).
//   2. expo-blur / BlurView → iOS 13+ frosted glass via
//      UIVisualEffectView with system materials.
//   3. Plain rgba fill → Android / web / older iOS without blur.
//
// The component API is identical across all three; callers don't
// need conditional render code.
export const HAS_NATIVE_BLUR =
  Platform.OS === 'ios' && !!requireOptionalNativeModule('ExpoBlurView');

type GlassEffectMod = {
  GlassView: React.ComponentType<{
    glassEffectStyle?: 'clear' | 'regular' | 'none';
    tintColor?: string;
    isInteractive?: boolean;
    style?: StyleProp<ViewStyle>;
    children?: React.ReactNode;
  }>;
  isLiquidGlassAvailable?: () => boolean;
};

let glassEffect: GlassEffectMod | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  glassEffect = require('expo-glass-effect') as GlassEffectMod;
} catch {
  glassEffect = null;
}

export const HAS_LIQUID_GLASS = Boolean(
  glassEffect?.GlassView && glassEffect.isLiquidGlassAvailable?.(),
);

let LazyBlurView: React.ComponentType<{
  intensity?: number;
  tint?: string;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}> | null = null;

if (HAS_NATIVE_BLUR) {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  LazyBlurView = require('expo-blur').BlurView;
}

type Variant = 'thin' | 'regular' | 'thick' | 'chrome';

const PRESETS: Record<Variant, { intensity: number; tintLight: string; tintDark: string }> = {
  thin: { intensity: 28, tintLight: 'systemThinMaterialLight', tintDark: 'systemThinMaterialDark' },
  regular: {
    intensity: 50,
    tintLight: 'systemMaterialLight',
    tintDark: 'systemMaterialDark',
  },
  thick: {
    intensity: 70,
    tintLight: 'systemThickMaterialLight',
    tintDark: 'systemThickMaterialDark',
  },
  chrome: {
    intensity: 90,
    tintLight: 'systemChromeMaterialLight',
    tintDark: 'systemChromeMaterialDark',
  },
};

// Map the legacy 4-step variant onto expo-glass-effect's 3 styles.
// "thin" → clear (least visible material), "regular" / "thick" / "chrome"
// → regular (the default solid Liquid Glass look). Apple deliberately
// kept the iOS 26 palette small.
const liquidStyleFor = (variant: Variant): 'clear' | 'regular' =>
  variant === 'thin' ? 'clear' : 'regular';

type Props = {
  variant?: Variant;
  dark?: boolean;
  radius?: number;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
  border?: boolean;
  // Liquid-Glass-only: lensing reacts to touch. Ignored on the
  // BlurView and rgba fallbacks.
  interactive?: boolean;
  // Liquid-Glass-only: tints the glass material. The BlurView
  // fallback uses the system-material tint and ignores this.
  tintColor?: string;
};

export const Glass: React.FC<Props> = ({
  variant = 'regular',
  dark = false,
  radius = 20,
  style,
  children,
  border = true,
  interactive = false,
  tintColor,
}) => {
  const preset = PRESETS[variant];
  const tint = dark ? preset.tintDark : preset.tintLight;
  const fallbackBg = dark ? 'rgba(28,28,32,0.78)' : 'rgba(255,255,255,0.72)';
  const innerHairline = dark ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.55)';
  const outerHairline = dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';

  if (HAS_LIQUID_GLASS && glassEffect) {
    const { GlassView } = glassEffect;
    // Liquid Glass clips itself; the wrapper still owns the corner
    // radius so RN children round with it. No fill needed — the
    // glass material is the background.
    return (
      <View
        style={[
          {
            borderRadius: radius,
            overflow: 'hidden',
            borderWidth: border ? StyleSheet.hairlineWidth : 0,
            borderColor: outerHairline,
            backgroundColor: 'transparent',
          },
          style,
        ]}
      >
        <GlassView
          glassEffectStyle={liquidStyleFor(variant)}
          tintColor={tintColor}
          isInteractive={interactive}
          style={StyleSheet.absoluteFill}
        />
        {children}
      </View>
    );
  }

  return (
    <View
      style={[
        {
          borderRadius: radius,
          overflow: 'hidden',
          borderWidth: border ? StyleSheet.hairlineWidth : 0,
          borderColor: outerHairline,
          backgroundColor: HAS_NATIVE_BLUR ? 'transparent' : fallbackBg,
        },
        style,
      ]}
    >
      {HAS_NATIVE_BLUR && LazyBlurView ? (
        <LazyBlurView intensity={preset.intensity} tint={tint} style={StyleSheet.absoluteFill} />
      ) : null}
      {border ? (
        <View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFill,
            {
              borderRadius: radius,
              borderTopWidth: StyleSheet.hairlineWidth,
              borderTopColor: innerHairline,
            },
          ]}
        />
      ) : null}
      {children}
    </View>
  );
};

type TranslucentProps = {
  dark?: boolean;
  intensity?: number;
  tint?: 'thick' | 'regular' | 'thin' | 'chrome';
  style?: StyleProp<ViewStyle>;
  tintColor?: string;
};

export const TranslucentFill: React.FC<TranslucentProps> = ({
  dark = false,
  tint = 'thick',
  style,
  tintColor,
}) => {
  if (HAS_LIQUID_GLASS && glassEffect) {
    const { GlassView } = glassEffect;
    return (
      <GlassView
        glassEffectStyle={liquidStyleFor(tint)}
        tintColor={tintColor}
        style={[StyleSheet.absoluteFill, style]}
      />
    );
  }
  if (HAS_NATIVE_BLUR && LazyBlurView) {
    const preset = PRESETS[tint];
    return (
      <LazyBlurView
        intensity={preset.intensity}
        tint={dark ? preset.tintDark : preset.tintLight}
        style={[StyleSheet.absoluteFill, style]}
      />
    );
  }
  const fallbackBg = dark ? 'rgba(28,28,32,0.86)' : 'rgba(255,255,255,0.84)';
  return (
    <View
      style={[
        StyleSheet.absoluteFill,
        { backgroundColor: fallbackBg },
        style,
      ]}
    />
  );
};

type ModalBackdropProps = {
  intensity?: number;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
};

export const ModalBackdrop: React.FC<ModalBackdropProps> = ({
  intensity = 36,
  style,
  children,
}) => {
  if (HAS_LIQUID_GLASS && glassEffect) {
    const { GlassView } = glassEffect;
    // Backdrop sits over arbitrary content, so use the heavier
    // "regular" Liquid Glass to keep the underlying view legibly
    // dimmed without an extra scrim.
    return (
      <View style={[{ flex: 1 }, style]}>
        <GlassView glassEffectStyle="regular" style={StyleSheet.absoluteFill} />
        {children}
      </View>
    );
  }
  if (HAS_NATIVE_BLUR && LazyBlurView) {
    return (
      <LazyBlurView
        intensity={intensity}
        tint="systemUltraThinMaterialDark"
        style={[StyleSheet.absoluteFill, style]}
      >
        {children}
      </LazyBlurView>
    );
  }
  return (
    <View style={[{ backgroundColor: 'rgba(0,0,0,0.28)', flex: 1 }, style]}>
      {children}
    </View>
  );
};
