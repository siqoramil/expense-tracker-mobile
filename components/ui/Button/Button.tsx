import { ActivityIndicator, Pressable, StyleProp, StyleSheet, Text, ViewStyle } from 'react-native';
import { Icon, type IconName } from '@/components/Icon';
import type { Tokens } from '@/lib/tokens';

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
