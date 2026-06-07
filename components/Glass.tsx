import { requireOptionalNativeModule } from 'expo-modules-core';
import React from 'react';
import { Platform, StyleProp, StyleSheet, View, type ViewStyle } from 'react-native';

// ModalBackdrop sits behind sheets and modals. Three rendering tiers
// (probed lazily so a missing native module never throws at import):
//   1. iOS 26+ Liquid Glass via expo-glass-effect's GlassView
//   2. iOS 15-25 frosted glass via expo-blur's UIVisualEffectView
//   3. Plain dark scrim on Android / web / older iOS
type GlassEffectMod = {
  GlassView: React.ComponentType<{
    glassEffectStyle?: 'clear' | 'regular' | 'none';
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

const HAS_LIQUID_GLASS = Boolean(glassEffect?.GlassView && glassEffect.isLiquidGlassAvailable?.());

const HAS_NATIVE_BLUR =
  (Platform.OS === 'ios' || Platform.OS === 'android') &&
  !!requireOptionalNativeModule('ExpoBlurView');

let LazyBlurView: React.ComponentType<{
  intensity?: number;
  tint?: string;
  experimentalBlurMethod?: 'none' | 'dimezisBlurView';
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}> | null = null;

if (HAS_NATIVE_BLUR) {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  LazyBlurView = require('expo-blur').BlurView;
}

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
    return (
      <View style={[{ flex: 1 }, style]}>
        <GlassView glassEffectStyle="regular" style={StyleSheet.absoluteFill} />
        {children}
      </View>
    );
  }
  if (HAS_NATIVE_BLUR && LazyBlurView) {
    const isAndroid = Platform.OS === 'android';
    return (
      <LazyBlurView
        intensity={isAndroid ? Math.min(intensity + 24, 90) : intensity}
        tint={isAndroid ? 'dark' : 'systemUltraThinMaterialDark'}
        // Android needs the Dimezis backend to actually blur; the default
        // method only tints. iOS ignores this prop.
        experimentalBlurMethod={isAndroid ? 'dimezisBlurView' : undefined}
        style={[StyleSheet.absoluteFill, style]}
      >
        {children}
      </LazyBlurView>
    );
  }
  return <View style={[{ backgroundColor: 'rgba(0,0,0,0.28)', flex: 1 }, style]}>{children}</View>;
};
