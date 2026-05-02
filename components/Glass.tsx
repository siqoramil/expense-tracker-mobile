import { requireOptionalNativeModule } from 'expo-modules-core';
import React from 'react';
import { Platform, StyleProp, StyleSheet, View, type ViewStyle } from 'react-native';

export const HAS_NATIVE_BLUR =
  Platform.OS === 'ios' && !!requireOptionalNativeModule('ExpoBlurView');

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

type Props = {
  variant?: Variant;
  dark?: boolean;
  radius?: number;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
  border?: boolean;
};

export const Glass: React.FC<Props> = ({
  variant = 'regular',
  dark = false,
  radius = 20,
  style,
  children,
  border = true,
}) => {
  const preset = PRESETS[variant];
  const tint = dark ? preset.tintDark : preset.tintLight;
  const fallbackBg = dark ? 'rgba(28,28,32,0.78)' : 'rgba(255,255,255,0.72)';
  const innerHairline = dark ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.55)';
  const outerHairline = dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';

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
};

export const TranslucentFill: React.FC<TranslucentProps> = ({
  dark = false,
  tint = 'thick',
  style,
}) => {
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
