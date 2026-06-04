import { forwardRef } from 'react';
import { TextInput, type TextInputProps } from 'react-native';

// App-wide text input. Disables OS autofill / password-manager suggestions so
// the keyboard accessory bar never covers or interrupts typing. Per-input props
// still override these defaults through the spread.
export const AppTextInput = forwardRef<TextInput, TextInputProps>(
  function AppTextInput(props, ref) {
    return (
      <TextInput
        autoComplete="off"
        importantForAutofill="no"
        textContentType="none"
        {...props}
        ref={ref}
      />
    );
  },
);
