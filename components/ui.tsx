import React, { useEffect } from 'react';
import {
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { fmtDate, fmtMoney, unitOf } from '../lib/format';
import type { Lang } from '../lib/i18n';
import { catLabel, store, type Transaction, type TxKind } from '../lib/store';
import type { Tokens } from '../lib/tokens';
import { Icon, type IconName } from './Icon';

export const Card: React.FC<{
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  t: Tokens;
  onPress?: () => void;
}> = ({ children, style, t, onPress }) => {
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

export const SectionHeader: React.FC<{
  title: string;
  action?: string;
  onAction?: () => void;
  t: Tokens;
}> = ({ title, action, onAction, t }) => (
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
      <Text
        onPress={onAction}
        style={{ fontSize: 13, color: t.accent, fontWeight: '500' }}
      >
        {action}
      </Text>
    ) : null}
  </View>
);

export const CatIcon: React.FC<{ cat: string; size?: number }> = ({ cat, size = 40 }) => {
  const c = store.get().categories.find((x) => x.id === cat);
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

export const MoneyText: React.FC<{
  amount: number;
  kind?: TxKind;
  t: Tokens;
  size?: number;
  mono?: boolean;
}> = ({ amount, kind, t, size = 15, mono = true }) => {
  const { prefs } = store.get();
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
  const unit = unitOf(prefs.currency);
  return (
    <Text style={style}>
      {sign}
      {fmtMoney(Math.abs(amount), prefs.currency)}
      {unit ? <Text style={{ opacity: 0.5, fontSize: size * 0.75 }}> {unit}</Text> : null}
    </Text>
  );
};

export const TxRow: React.FC<{
  tx: Transaction;
  t: Tokens;
  last?: boolean;
  onPress?: (tx: Transaction) => void;
}> = ({ tx, t, last, onPress }) => {
  const s = store.get();
  const lang = s.prefs.lang;
  const cat = s.categories.find((c) => c.id === tx.cat);
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
        <Text
          numberOfLines={1}
          style={{ fontSize: 15, fontWeight: '500', color: t.text }}
        >
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

export const ScreenHeader: React.FC<{
  title: string;
  subtitle?: string;
  trailing?: React.ReactNode;
  t: Tokens;
  onBack?: () => void;
}> = ({ title, subtitle, trailing, t, onBack }) => (
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
            backgroundColor: on ? t.surface : 'transparent',
            alignItems: 'center',
          }}
        >
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

export const Press: React.FC<{
  onPress?: () => void;
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}> = ({ onPress, children, style }) => (
  <Pressable
    onPress={onPress}
    style={({ pressed }) => [style, pressed && { transform: [{ scale: 0.96 }] }]}
  >
    {children}
  </Pressable>
);

export const EmptyState: React.FC<{
  icon?: IconName;
  title: string;
  subtitle?: string;
  t: Tokens;
}> = ({ icon = 'wallet', title, subtitle, t }) => (
  <View
    style={{
      padding: 40,
      alignItems: 'center',
      gap: 10,
    }}
  >
    <View
      style={{
        width: 68,
        height: 68,
        borderRadius: 34,
        backgroundColor: t.surfaceAlt,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: t.border,
        marginBottom: 6,
      }}
    >
      <Icon name={icon} size={28} color={t.textTer} stroke={1.8} />
    </View>
    <Text style={{ fontSize: 15, fontWeight: '600', color: t.text }}>{title}</Text>
    {subtitle ? (
      <Text style={{ fontSize: 13, color: t.textSec, textAlign: 'center', maxWidth: 220 }}>
        {subtitle}
      </Text>
    ) : null}
  </View>
);

export const Toast: React.FC<{ toast: string | null; t: Tokens }> = ({ toast, t }) => {
  if (!toast) return null;
  return (
    <View
      pointerEvents="none"
      style={{
        position: 'absolute',
        top: 60,
        left: 0,
        right: 0,
        alignItems: 'center',
        zIndex: 200,
      }}
    >
      <View
        style={{
          backgroundColor: t.text,
          paddingVertical: 10,
          paddingHorizontal: 18,
          borderRadius: 24,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
          shadowColor: '#000',
          shadowOpacity: 0.18,
          shadowRadius: 24,
          shadowOffset: { width: 0, height: 8 },
          elevation: 6,
        }}
      >
        <Icon name="check" size={16} color={t.surface} stroke={3} />
        <Text style={{ color: t.surface, fontSize: 14, fontWeight: '500' }}>{toast}</Text>
      </View>
    </View>
  );
};

export const Switch: React.FC<{ on: boolean; onChange: (v: boolean) => void; t: Tokens }> = ({
  on,
  onChange,
  t,
}) => {
  const progress = useSharedValue(on ? 1 : 0);

  useEffect(() => {
    progress.value = withTiming(on ? 1 : 0, { duration: 260 });
  }, [on, progress]);

  const trackStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      progress.value,
      [0, 1],
      [t.surfaceAlt, t.accent],
    ),
    borderColor: interpolateColor(
      progress.value,
      [0, 1],
      [t.borderStrong, t.accent],
    ),
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

export const IconButton: React.FC<{
  icon: IconName;
  onPress?: () => void;
  t: Tokens;
  badge?: number;
}> = ({ icon, onPress, t, badge }) => (
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

export const DetailRow: React.FC<{ t: Tokens; label: string; value: string; last?: boolean }> = ({
  t,
  label,
  value,
  last,
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
