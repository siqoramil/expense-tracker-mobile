import React, { forwardRef, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated as RNAnimated,
  PanResponder,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';
import Animated, {
  Easing,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import type { ToastType } from '@/lib/toast';
import type { Tokens } from '@/lib/tokens';
import { Icon, type IconName } from '@/components/Icon';
import {
  catLabel,
  type Category,
  type Transaction,
  type TxKind,
  useStoreSelector,
} from '@/lib/store';
import { fmtDate, fmtMoney, unitOf } from '@/lib/format';
import { AppTextInput } from '@/components/AppTextInput';

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

export const Card = ({
  children,
  style,
  t,
  onPress,
}: React.PropsWithChildren<{ style?: StyleProp<ViewStyle>; t: Tokens; onPress?: () => void }>) => {
  const s: StyleProp<ViewStyle> = [
    {
      backgroundColor: t.surface,
      borderRadius: 20,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: t.border,
    },
    style,
  ];
  if (onPress) {
    return (
      <Pressable onPress={onPress} style={s}>
        {children}
      </Pressable>
    );
  }
  return <View style={s}>{children}</View>;
};

export const SectionHeader = ({
  title,
  action,
  onAction,
  t,
}: {
  title: string;
  action?: string;
  onAction?: () => void;
  t: Tokens;
}) => (
  <View
    style={{
      flexDirection: 'row',
      alignItems: 'baseline',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      marginBottom: 10,
    }}
  >
    <Text
      style={{
        fontSize: 12.5,
        fontWeight: '600',
        color: t.textSec,
        textTransform: 'uppercase',
        letterSpacing: 0.6,
      }}
    >
      {title}
    </Text>
    {action ? (
      <Text onPress={onAction} style={{ fontSize: 13, color: t.accent, fontWeight: '500' }}>
        {action}
      </Text>
    ) : null}
  </View>
);

export const CatIcon = ({ cat, size = 40 }: { cat: string; size?: number }) => {
  const c = useStoreSelector<Category | undefined>(
    (s) => s.categories.find((x) => x.id === cat),
    (a, b) => a?.id === b?.id && a?.color === b?.color && a?.icon === b?.icon,
  );
  if (!c) return <View style={{ width: size, height: size }} />;
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2.5,
        backgroundColor: c.color + '22',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Icon name={c.icon as IconName} size={size * 0.5} color={c.color} stroke={2} />
    </View>
  );
};

export const MoneyText = ({
  amount,
  kind,
  t,
  size = 15,
  mono = true,
}: {
  amount: number;
  kind?: TxKind;
  t: Tokens;
  size?: number;
  mono?: boolean;
}) => {
  const currency = useStoreSelector((s) => s.prefs.currency);
  const up = kind === 'income';
  const color = kind == null ? t.text : up ? t.income : t.expense;
  const sign = kind == null ? '' : up ? '+' : '−';
  const style: StyleProp<TextStyle> = {
    fontFamily: mono ? 'Menlo' : undefined,
    fontSize: size,
    fontWeight: '600',
    color,
    fontVariant: ['tabular-nums'],
  };
  const unit = unitOf(currency);
  return (
    <Text style={style}>
      {sign}
      {fmtMoney(Math.abs(amount), currency)}
      {unit ? <Text style={{ opacity: 0.5, fontSize: size * 0.75 }}> {unit}</Text> : null}
    </Text>
  );
};

export const TxRow = ({
  tx,
  t,
  last,
  onPress,
}: {
  tx: Transaction;
  t: Tokens;
  last?: boolean;
  onPress?: (tx: Transaction) => void;
}) => {
  const lang = useStoreSelector((s) => s.prefs.lang);
  const cat = useStoreSelector<Category | undefined>(
    (s) => s.categories.find((c) => c.id === tx.cat),
    (a, b) => a?.id === b?.id && a?.label?.en === b?.label?.en,
  );
  return (
    <Pressable
      onPress={() => onPress?.(tx)}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: last ? 0 : StyleSheet.hairlineWidth,
        borderBottomColor: t.divider,
        gap: 12,
      }}
    >
      <CatIcon cat={tx.cat} size={38} />
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text numberOfLines={1} style={{ fontSize: 15, fontWeight: '500', color: t.text }}>
          {tx.note || catLabel(cat, lang)}
        </Text>
        <Text style={{ fontSize: 12.5, color: t.textSec, marginTop: 2 }}>
          {catLabel(cat, lang)} · {fmtDate(tx.date, lang)}
        </Text>
      </View>
      <MoneyText amount={tx.amount} kind={tx.kind} t={t} />
    </Pressable>
  );
};

export const ScreenHeader = ({
  title,
  subtitle,
  trailing,
  t,
  onBack,
}: {
  title: string;
  subtitle?: string;
  trailing?: React.ReactNode;
  t: Tokens;
  onBack?: () => void;
}) => (
  <View
    style={{
      paddingTop: onBack ? 8 : 20,
      paddingHorizontal: 20,
      paddingBottom: onBack ? 10 : 16,
    }}
  >
    {onBack ? (
      <Pressable
        onPress={onBack}
        style={{
          width: 36,
          height: 36,
          borderRadius: 18,
          alignItems: 'center',
          justifyContent: 'center',
          marginLeft: -8,
          marginBottom: 4,
        }}
      >
        <Icon name="chevron-left" size={22} color={t.text} stroke={2.5} />
      </Pressable>
    ) : null}
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        gap: 12,
      }}
    >
      <View style={{ flex: 1 }}>
        {subtitle ? (
          <Text
            style={{
              fontSize: 13,
              color: t.textSec,
              fontWeight: '500',
              marginBottom: 4,
              letterSpacing: 0.2,
            }}
          >
            {subtitle}
          </Text>
        ) : null}
        <Text style={{ fontSize: 30, fontWeight: '700', color: t.text, letterSpacing: -0.8 }}>
          {title}
        </Text>
      </View>
      {trailing}
    </View>
  </View>
);

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

export const Toast = ({
  toast,
  t,
  onDismiss,
}: {
  toast: { msg: string; type: ToastType } | null;
  t: Tokens;
  onDismiss: () => void;
}) => {
  const pan = useRef(new RNAnimated.ValueXY()).current;
  const appear = useRef(new RNAnimated.Value(0)).current;
  const dismissRef = useRef(onDismiss);
  dismissRef.current = onDismiss;

  useEffect(() => {
    if (toast) {
      pan.setValue({ x: 0, y: 0 });
      appear.setValue(0);
      RNAnimated.spring(appear, {
        toValue: 1,
        useNativeDriver: true,
        friction: 9,
        tension: 80,
      }).start();
    }
  }, [toast, pan, appear]);

  const responder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_e, g) => Math.abs(g.dy) > 6 || Math.abs(g.dx) > 6,
      onPanResponderMove: (_e, g) => {
        // allow swiping up or sideways; don't let it drag down
        pan.setValue({ x: g.dx, y: Math.min(g.dy, 0) });
      },
      onPanResponderRelease: (_e, g) => {
        const up = g.dy < -50;
        const side = Math.abs(g.dx) > 90;
        if (up || side) {
          RNAnimated.timing(pan, {
            toValue: { x: side ? (g.dx > 0 ? 600 : -600) : 0, y: up ? -220 : 0 },
            duration: 180,
            useNativeDriver: true,
          }).start(() => dismissRef.current());
        } else {
          RNAnimated.spring(pan, {
            toValue: { x: 0, y: 0 },
            useNativeDriver: true,
            friction: 9,
          }).start();
        }
      },
    }),
  ).current;

  if (!toast) return null;
  const cfg = {
    success: { icon: 'check' as const, color: t.income },
    error: { icon: 'close' as const, color: t.expense },
    info: { icon: 'info' as const, color: t.accent },
  }[toast.type];
  const entranceY = appear.interpolate({ inputRange: [0, 1], outputRange: [-18, 0] });
  return (
    <View
      pointerEvents="box-none"
      style={{ position: 'absolute', top: 54, left: 16, right: 16, zIndex: 200 }}
    >
      <RNAnimated.View
        {...responder.panHandlers}
        style={{
          opacity: appear,
          transform: [{ translateX: pan.x }, { translateY: RNAnimated.add(pan.y, entranceY) }],
        }}
      >
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 11,
            backgroundColor: t.sheetBg,
            paddingVertical: 12,
            paddingLeft: 14,
            paddingRight: 8,
            borderRadius: 18,
            borderWidth: StyleSheet.hairlineWidth,
            borderColor: t.border,
            shadowColor: '#000',
            shadowOpacity: t.dark ? 0.4 : 0.16,
            shadowRadius: 24,
            shadowOffset: { width: 0, height: 10 },
            elevation: 10,
          }}
        >
          <View
            style={{
              width: 28,
              height: 28,
              borderRadius: 14,
              backgroundColor: cfg.color + '22',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon name={cfg.icon} size={16} color={cfg.color} stroke={2.8} />
          </View>
          <Text
            style={{ flex: 1, color: t.text, fontSize: 14, fontWeight: '600' }}
            numberOfLines={3}
          >
            {toast.msg}
          </Text>
          <Pressable
            onPress={() => dismissRef.current()}
            hitSlop={10}
            style={{
              width: 28,
              height: 28,
              borderRadius: 14,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon name="close" size={14} color={t.textTer} stroke={2.6} />
          </Pressable>
        </View>
      </RNAnimated.View>
    </View>
  );
};

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

export const IconButton = ({
  icon,
  onPress,
  t,
  badge,
}: {
  icon: IconName;
  onPress?: () => void;
  t: Tokens;
  badge?: number;
}) => (
  <Pressable
    onPress={onPress}
    style={{
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: t.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: t.border,
      alignItems: 'center',
      justifyContent: 'center',
    }}
  >
    <Icon name={icon} size={18} color={t.textSec} />
    {badge && badge > 0 ? (
      <View
        style={{
          position: 'absolute',
          top: 2,
          right: 2,
          minWidth: 16,
          height: 16,
          borderRadius: 8,
          backgroundColor: t.expense,
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: 4,
          borderWidth: 1.5,
          borderColor: t.surface,
        }}
      >
        <Text style={{ color: '#fff', fontSize: 10, fontWeight: '700' }}>{badge}</Text>
      </View>
    ) : null}
  </Pressable>
);

type ButtonVariant = 'primary' | 'danger' | 'secondary' | 'ghost';
type ButtonSize = 'md' | 'lg';

type ButtonProps = {
  label: string;
  onPress: () => void;
  t: Tokens;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  icon?: IconName;
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
};

export const Button = ({
  label,
  onPress,
  t,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon,
  fullWidth = true,
  style,
}: ButtonProps) => {
  const inactive = disabled || loading;

  const inlineVariantStyle: ViewStyle =
    variant === 'primary'
      ? {
          shadowColor: t.accent,
          shadowOpacity: 0.3,
          shadowRadius: 14,
          shadowOffset: { width: 0, height: 4 },
          elevation: 4,
        }
      : variant === 'secondary'
        ? { borderWidth: StyleSheet.hairlineWidth, borderColor: t.border }
        : {};

  // Colors for Icon and ActivityIndicator — these are runtime values.
  const indicatorColor = variant === 'primary' || variant === 'danger' ? '#fff' : t.accent;
  const textColor =
    variant === 'primary' || variant === 'danger'
      ? '#fff'
      : variant === 'ghost'
        ? t.accent
        : t.text;

  const bgColor =
    variant === 'primary'
      ? t.accent
      : variant === 'danger'
        ? t.expense
        : variant === 'secondary'
          ? t.surfaceAlt
          : 'transparent';

  return (
    <Pressable
      onPress={inactive ? undefined : onPress}
      style={({ pressed }) => [
        {
          height: size === 'lg' ? 54 : 52,
          backgroundColor: bgColor,
          borderRadius: 14,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          opacity: inactive ? 0.5 : 1,
          alignSelf: fullWidth ? 'stretch' : 'flex-start',
        },
        inlineVariantStyle,
        !inactive && pressed && { transform: [{ scale: 0.98 }], opacity: 0.92 },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={indicatorColor} />
      ) : (
        <>
          {icon ? <Icon name={icon} size={18} color={textColor} stroke={2} /> : null}
          <Text style={{ color: textColor, fontSize: 16, fontWeight: '700', letterSpacing: 0.2 }}>
            {label}
          </Text>
        </>
      )}
    </Pressable>
  );
};

export const DetailRow = ({
  t,
  label,
  value,
  last,
}: {
  t: Tokens;
  label: string;
  value: string;
  last?: boolean;
}) => (
  <View
    style={{
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 13,
      borderBottomWidth: last ? 0 : StyleSheet.hairlineWidth,
      borderBottomColor: t.divider,
    }}
  >
    <Text style={{ fontSize: 13.5, color: t.textSec, flex: 1 }}>{label}</Text>
    <Text style={{ fontSize: 14, fontWeight: '500', color: t.text }}>{value}</Text>
  </View>
);

export type InputProps = { t: Tokens; error?: boolean } & TextInputProps;

export const Input = forwardRef<TextInput, InputProps>(function Input(
  { t, error = false, style, placeholderTextColor, ...rest },
  ref,
) {
  const borderColor = error ? t.expense : t.border;
  return (
    <AppTextInput
      placeholderTextColor={placeholderTextColor ?? t.textTer}
      {...rest}
      ref={ref}
      style={[
        {
          paddingVertical: 14,
          paddingHorizontal: 16,
          borderRadius: 14,
          backgroundColor: t.surfaceAlt,
          fontSize: 15,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor,
          color: t.text,
        },
        style,
      ]}
    />
  );
});

export const Field = ({
  t,
  label,
  error,
  helper,
  children,
  style,
}: React.PropsWithChildren<{
  t: Tokens;
  label?: string;
  error?: string | null;
  helper?: string;
  style?: StyleProp<ViewStyle>;
}>) => (
  <View style={style}>
    {label ? (
      <Text
        style={{
          fontSize: 11,
          fontWeight: '700',
          color: t.textSec,
          marginBottom: 7,
          letterSpacing: 0.6,
          textTransform: 'uppercase',
        }}
      >
        {label}
      </Text>
    ) : null}
    {children}
    {error ? (
      <Text style={{ color: t.expense, fontSize: 13, marginTop: 10, fontWeight: '500' }}>
        {error}
      </Text>
    ) : helper ? (
      <Text style={{ color: t.textSec, fontSize: 12, marginTop: 8 }}>{helper}</Text>
    ) : null}
  </View>
);

// Segmented one-time-code input: one box per digit. A single invisible TextInput
// sits over the boxes to capture taps, keyboard input, and OS code autofill; the
// digits are rendered in the boxes, not the input itself.
export const CodeInput = forwardRef<
  TextInput,
  {
    t: Tokens;
    value: string;
    onChangeText: (code: string) => void;
    length?: number;
    error?: boolean;
    autoFocus?: boolean;
    onComplete?: (code: string) => void;
  }
>(function CodeInput(
  { t, value, onChangeText, length = 6, error = false, autoFocus, onComplete },
  ref,
) {
  const inputRef = useRef<TextInput | null>(null);
  const [focused, setFocused] = useState(false);

  const setRef = (node: TextInput | null) => {
    inputRef.current = node;
    if (typeof ref === 'function') ref(node);
    else if (ref) (ref as React.MutableRefObject<TextInput | null>).current = node;
  };

  const handleChange = (txt: string) => {
    const cleaned = txt.replace(/[^0-9]/g, '').slice(0, length);
    onChangeText(cleaned);
    if (cleaned.length === length) onComplete?.(cleaned);
  };

  return (
    <Pressable onPress={() => inputRef.current?.focus()} style={{ flexDirection: 'row', gap: 8 }}>
      {Array.from({ length }).map((_, i) => {
        const char = value[i] ?? '';
        const isActive =
          focused && (i === value.length || (value.length === length && i === length - 1));
        return (
          <View
            key={i}
            style={{
              flex: 1,
              height: 56,
              borderRadius: 12,
              borderWidth: error || isActive ? 1.5 : StyleSheet.hairlineWidth,
              borderColor: error ? t.expense : isActive ? t.accent : t.border,
              backgroundColor: t.surfaceAlt,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ fontSize: 22, fontWeight: '700', color: t.text }}>{char}</Text>
          </View>
        );
      })}
      <TextInput
        ref={setRef}
        value={value}
        onChangeText={handleChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        keyboardType="number-pad"
        maxLength={length}
        caretHidden
        autoFocus={autoFocus}
        textContentType="oneTimeCode"
        autoComplete="sms-otp"
        // Fully invisible (opacity 0, not just transparent text) so the value
        // never bleeds into the first box on devices that ignore a transparent
        // text color. It still captures taps, focus, and OS code autofill.
        style={[StyleSheet.absoluteFill, { opacity: 0 }]}
      />
    </Pressable>
  );
});
