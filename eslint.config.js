const expoConfig = require('eslint-config-expo/flat');
const prettierConfig = require('eslint-config-prettier');

module.exports = [
  ...expoConfig,
  prettierConfig,
  {
    settings: {
      // Pin React version explicitly to avoid eslint-plugin-react@7.x
      // calling the removed getFilename() API in ESLint 10 flat config.
      react: { version: '19' },
    },
    rules: {
      'no-console': 'warn',
      // react-hooks v7 introduced strict rules that produce false positives
      // for well-established RN patterns:
      //   set-state-in-effect: resetting modal state on visibility change is
      //     intentional (effect depends on `visible` prop).
      //   refs: useRef(new Animated.Value()).current is the standard RN
      //     Animated API idiom — the ref never changes after mount.
      //   no-nested-components: inline sub-components inside render are
      //     acceptable when scoped to closures that capture local state.
      'react-hooks/set-state-in-effect': 'off',
      'react-hooks/refs': 'off',
      'react-hooks/no-nested-components': 'off',
      // Nested component definitions that capture outer props/state via closure
      // (e.g. Label in LoginScreen, Stepper in TimePicker) are a common
      // React Native pattern. The static-components rule incorrectly flags them.
      'react-hooks/static-components': 'off',
      // i18next exports a default instance that has named methods; calling
      // those methods on the default import is the documented i18next pattern.
      'import/no-named-as-default-member': 'off',
    },
  },
  {
    ignores: [
      'node_modules/',
      '.expo/',
      'dist/',
      'ios/',
      'android/',
      'web-build/',
      'babel.config.js',
      'metro.config.js',
      // Test fixture files — plain JS with globals, no imports
      'test/',
    ],
  },
];
