import React from 'react';
import { Platform, Pressable, Text, View } from 'react-native';
import type { Tokens } from '@/lib/tokens';
import { Icon } from '@/components/Icon';

// Large-title header for tab screens. No navigator draws a header for tabs on
// either platform, so each tab supplies its own title. The "+" action is shown
// only on iOS — on Android the custom FAB tab bar already provides add.
export const TabHeader: React.FC<{ t: Tokens; title: string; onAdd?: () => void }> = ({
  t,
  title,
  onAdd,
}) => {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 4,
        paddingBottom: 10,
      }}
    >
      <Text style={{ fontSize: 30, fontWeight: '700', color: t.text, letterSpacing: -0.6 }}>
        {title}
      </Text>
      {onAdd && Platform.OS === 'ios' ? (
        <Pressable
          onPress={onAdd}
          hitSlop={10}
          style={({ pressed }) => ({
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: t.accent,
            alignItems: 'center',
            justifyContent: 'center',
            shadowColor: t.accent,
            shadowOpacity: 0.3,
            shadowRadius: 10,
            shadowOffset: { width: 0, height: 4 },
            transform: [{ scale: pressed ? 0.94 : 1 }],
          })}
        >
          <Icon name="plus" size={22} color="#fff" stroke={2.5} />
        </Pressable>
      ) : null}
    </View>
  );
};
