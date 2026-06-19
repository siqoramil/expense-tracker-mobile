import React from 'react';
import { Platform, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Tab screens have no native navigator header on either platform.
//
// iOS: the floating glass TabHeader occupies the top safe-area area, so we
// render a plain View that fills the whole screen (no top edge consumed here —
// the header floats absolutely over content). The screen background still
// covers behind the status bar.
//
// Android: SafeAreaView consumes the top edge so the in-flow header sits
// below the status bar exactly as before.
export const TabSafeArea: React.FC<{ bg: string; children: React.ReactNode }> = ({
  bg,
  children,
}) => {
  if (Platform.OS === 'ios') {
    return (
      <View style={{ flex: 1, backgroundColor: bg }}>
        {children}
      </View>
    );
  }
  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: bg }}>
      {children}
    </SafeAreaView>
  );
};
