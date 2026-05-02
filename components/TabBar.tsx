import React from 'react';
import { Dimensions, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import type { Lang } from '../lib/i18n';
import type { Tokens } from '../lib/tokens';
import { Icon, type IconName } from './Icon';

export type TabKey = 'home' | 'stats' | 'debtors' | 'profile';

const BAR_H = 60;
const BAR_MARGIN_H = 16;
const FAB_SIZE = 60;
const FAB_LIFT = 40;
const NOTCH_R = 42;
const NOTCH_D = 32;
const NOTCH_EASE = 20;

const SCREEN_W = Dimensions.get('window').width;
const BAR_W = SCREEN_W - BAR_MARGIN_H * 2;

const buildBarPath = (W: number, H: number) => {
  const r = H / 2;
  const c = W / 2;
  return [
    `M ${r} 0`,
    `L ${c - NOTCH_R - NOTCH_EASE} 0`,
    `C ${c - NOTCH_R} 0 ${c - NOTCH_R} ${NOTCH_D} ${c} ${NOTCH_D}`,
    `C ${c + NOTCH_R} ${NOTCH_D} ${c + NOTCH_R} 0 ${c + NOTCH_R + NOTCH_EASE} 0`,
    `L ${W - r} 0`,
    `A ${r} ${r} 0 0 1 ${W} ${r}`,
    `L ${W} ${H - r}`,
    `A ${r} ${r} 0 0 1 ${W - r} ${H}`,
    `L ${r} ${H}`,
    `A ${r} ${r} 0 0 1 0 ${H - r}`,
    `L 0 ${r}`,
    `A ${r} ${r} 0 0 1 ${r} 0`,
    `Z`,
  ].join(' ');
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
  const bottomPad = Math.max(insets.bottom, 12);

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
          height: BAR_H,
          shadowColor: '#000',
          shadowOpacity: t.dark ? 0.45 : 0.14,
          shadowRadius: 22,
          shadowOffset: { width: 0, height: 10 },
          elevation: 12,
        }}
      >
        <Svg width={BAR_W} height={BAR_H} pointerEvents="none">
          <Path d={buildBarPath(BAR_W, BAR_H)} fill={t.tabBg} />
        </Svg>
      </View>

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
        <View style={{ width: NOTCH_R * 2 + NOTCH_EASE * 2 - 16 }} />
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
              shadowColor: '#0F1729',
              shadowOpacity: 0.22,
              shadowRadius: 14,
              shadowOffset: { width: 0, height: 8 },
              elevation: 14,
              overflow: 'hidden',
            },
            pressed && { transform: [{ scale: 0.92 }] },
          ]}
        >
          <View
            pointerEvents="none"
            style={[
              StyleSheet.absoluteFill,
              {
                borderRadius: FAB_SIZE / 2,
                borderTopWidth: 1,
                borderTopColor: 'rgba(255,255,255,0.45)',
              },
            ]}
          />
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
    style={({ pressed }) => [
      {
        flex: 1,
        height: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
      },
      pressed && { opacity: 0.55 },
    ]}
  >
    <Icon
      name={active ? tab.iconFill : tab.icon}
      size={22}
      color={active ? t.accent : t.textSec}
      stroke={2}
    />
    <View
      style={{
        width: 5,
        height: 5,
        borderRadius: 2.5,
        backgroundColor: active ? t.accent : 'transparent',
      }}
    />
  </Pressable>
);
