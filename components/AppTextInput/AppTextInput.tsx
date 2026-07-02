import { forwardRef, useEffect, useRef } from 'react';
import { Platform, TextInput, type TextInputProps } from 'react-native';

// One plain font for every input + placeholder across the app, regardless of the
// device's font skin. iOS → San Francisco, Android → Roboto. Set as the base of
// the style array so per-input styles can still override it when needed.
const INPUT_FONT_FAMILY = Platform.select({ ios: 'System', android: 'sans-serif' });

// Delay (ms) before an auto-focused input grabs focus. Native `autoFocus` fires
// the instant the input mounts, which raises the keyboard BEFORE a sheet/modal
// has finished sliding in (keyboard-first, then the sheet). Deferring the focus
// lets the keyboard rise together with / just after the sheet's open animation.
const AUTO_FOCUS_DELAY = 250;

// App-wide text input. Disables OS autofill / password-manager suggestions so
// the keyboard accessory bar never covers or interrupts typing. Per-input props
// still override these defaults through the spread.
export const AppTextInput = forwardRef<TextInput, TextInputProps>(
  function AppTextInput({ autoFocus, style, ...props }, ref) {
    const innerRef = useRef<TextInput | null>(null);

    useEffect(() => {
      if (!autoFocus) return;
      const id = setTimeout(() => innerRef.current?.focus(), AUTO_FOCUS_DELAY);
      return () => clearTimeout(id);
    }, [autoFocus]);

    const setRef = (node: TextInput | null) => {
      innerRef.current = node;
      if (typeof ref === 'function') ref(node);
      else if (ref) (ref as React.MutableRefObject<TextInput | null>).current = node;
    };

    return (
      <TextInput
        autoComplete="off"
        importantForAutofill="no"
        textContentType="none"
        {...props}
        style={[{ fontFamily: INPUT_FONT_FAMILY }, style]}
        ref={setRef}
      />
    );
  },
);
