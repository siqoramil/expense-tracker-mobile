import { forwardRef } from 'react';
import { StyleSheet, TextInput, TextInputProps } from 'react-native';
import type { Tokens } from '@/lib/tokens';
import { AppTextInput } from '@/components/AppTextInput';

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
