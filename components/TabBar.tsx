import React from 'react';
import { Dimensions, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import type { Lang } from '../lib/i18n';
import type { Tokens } from '../lib/tokens';
import { Icon, type IconName } from './Icon';

export type TabKey = 'home' | 'stats' | 'debtors' | 'profile';

const BAR_H = 64;
const BAR_RADIUS = 32;
const BAR_MARGIN_H = 16;
const BAR_MARGIN_B = 0;
const FAB_SIZE = 56;
const FAB_LIFT = 26;
const NOTCH_R = 42;
const NOTCH_D = 22;
const NOTCH_EASE = 14;

const SCREEN_W = Dimensions.get('window').width;
const BAR_W = SCREEN_W - BAR_MARGIN_H * 2;

const notchCutoutPath = (w: number) => {
  const c = w / 2;
  return `M ${c - NOTCH_R - NOTCH_EASE} 0 C ${c - NOTCH_R} 0 ${c - NOTCH_R} ${NOTCH_D} ${c} ${NOTCH_D} C ${c + NOTCH_R} ${NOTCH_D} ${c + NOTCH_R} 0 ${c + NOTCH_R + NOTCH_EASE} 0 Z`;
};

export const TabBar: React.FC<{
  active: TabKey;
  onChange: (k: TabKey) => void;
  onFab: () => void;
  t: Tokens;
  lang: Lang;
}> = ({ active, onChange, onFab, t }) => {
  const insets = useSafeAreaInsets();
  const tabs: { k: TabKey; icon: IconName; iconFill: IconName }[] = [
    { k: 'home', icon: 'home', iconFill: 'home-fill' },
    { k: 'stats', icon: 'chart', iconFill: 'chart-fill' },
    { k: 'debtors', icon: 'users', iconFill: 'users-fill' },
    { k: 'profile', icon: 'user', iconFill: 'user-fill' },
  ];
  const bottomPad = Math.max(insets.bottom, 8) + BAR_MARGIN_B;

  return (
    <View
      pointerEvents="box-none"
      style={{
        position: 'absolute',
        bottom: bottomPad,
        left: BAR_MARGIN_H,
        right: BAR_MARGIN_H,
        height: BAR_H,
      }}
    >
      <View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          borderRadius: BAR_RADIUS,
          backgroundColor: t.tabBg,
          shadowColor: '#000',
          shadowOpacity: 0.12,
          shadowRadius: 20,
          shadowOffset: { width: 0, height: 8 },
          elevation: 10,
        }}
      />

      <Svg
        width={BAR_W}
        height={BAR_H}
        style={{ position: 'absolute', top: 0, left: 0 }}
        pointerEvents="none"
      >
        <Path d={notchCutoutPath(BAR_W)} fill={t.bg} />
      </Svg>

      <View
        style={{
          height: BAR_H,
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 8,
        }}
      >
        {tabs.slice(0, 2).map((tab) => (
          <TabItem
            key={tab.k}
            tab={tab}
            active={active === tab.k}
            onPress={() => onChange(tab.k)}
            t={t}
          />
        ))}
        <View style={{ width: FAB_SIZE + 16 }} />
        {tabs.slice(2).map((tab) => (
          <TabItem
            key={tab.k}
            tab={tab}
            active={active === tab.k}
            onPress={() => onChange(tab.k)}
            t={t}
          />
        ))}
      </View>

      <View
        pointerEvents="box-none"
        style={{
          position: 'absolute',
          top: -FAB_LIFT,
          left: 0,
          right: 0,
          alignItems: 'center',
        }}
      >
        <Pressable
          onPress={onFab}
          style={({ pressed }) => [
            {
              width: FAB_SIZE,
              height: FAB_SIZE,
              borderRadius: FAB_SIZE / 2,
              backgroundColor: t.accent,
              alignItems: 'center',
              justifyContent: 'center',
              shadowColor: t.accent,
              shadowOpacity: 0.4,
              shadowRadius: 14,
              shadowOffset: { width: 0, height: 6 },
              elevation: 12,
            },
            pressed && { transform: [{ scale: 0.92 }] },
          ]}
        >
          <Icon name="plus" size={26} color="#fff" stroke={2.5} />
        </Pressable>
      </View>
    </View>
  );
};

const TabItem: React.FC<{
  tab: { k: TabKey; icon: IconName; iconFill: IconName };
  active: boolean;
  onPress: () => void;
  t: Tokens;
}> = ({ tab, active, onPress, t }) => (
  <Pressable
    onPress={onPress}
    style={{
      flex: 1,
      height: '100%',
      alignItems: 'center',
      justifyContent: 'center',
    }}
  >
    <Icon
      name={active ? tab.iconFill : tab.icon}
      size={24}
      color={active ? t.accent : t.textSec}
      stroke={1.8}
    />
  </Pressable>
);
