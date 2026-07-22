import React, { forwardRef, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import type { Tokens } from '@/lib/tokens';

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
