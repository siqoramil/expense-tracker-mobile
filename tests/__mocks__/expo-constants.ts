// Stub for expo-constants. Tests that need a specific apiUrl can do
// `(constants.expoConfig as any).extra.apiUrl = '...'` before importing.
const constants = {
  expoConfig: {
    extra: {
      apiUrl: 'https://test.example.com',
    },
  },
};

export default constants;
