import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';

// Tab screens have no native navigator header on either platform (iOS uses
// NativeTabs, Android hides the JS Tabs header), so each screen supplies its
// own header below the status-bar inset provided here.
export const TabSafeArea: React.FC<{ bg: string; children: React.ReactNode }> = ({ bg, children }) => (
  <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: bg }}>
    {children}
  </SafeAreaView>
);
