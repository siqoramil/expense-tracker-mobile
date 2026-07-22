import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Icon } from '@/components/Icon';
import type { Tokens } from '@/lib/tokens';

export const ScreenHeader = ({
  title,
  subtitle,
  trailing,
  t,
  onBack,
}: {
  title: string;
  subtitle?: string;
  trailing?: React.ReactNode;
  t: Tokens;
  onBack?: () => void;
}) => (
  <View
    style={{
      paddingTop: onBack ? 8 : 20,
      paddingHorizontal: 20,
      paddingBottom: onBack ? 10 : 16,
    }}
  >
    {onBack ? (
      <Pressable
        onPress={onBack}
        style={{
          width: 36,
          height: 36,
          borderRadius: 18,
          alignItems: 'center',
          justifyContent: 'center',
          marginLeft: -8,
          marginBottom: 4,
        }}
      >
        <Icon name="chevron-left" size={22} color={t.text} stroke={2.5} />
      </Pressable>
    ) : null}
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        gap: 12,
      }}
    >
      <View style={{ flex: 1 }}>
        {subtitle ? (
          <Text
            style={{
              fontSize: 13,
              color: t.textSec,
              fontWeight: '500',
              marginBottom: 4,
              letterSpacing: 0.2,
            }}
          >
            {subtitle}
          </Text>
        ) : null}
        <Text style={{ fontSize: 30, fontWeight: '700', color: t.text, letterSpacing: -0.8 }}>
          {title}
        </Text>
      </View>
      {trailing}
    </View>
  </View>
);
