import { useEffect, useRef } from 'react';
import {
  Animated as RNAnimated,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { ToastType } from '@/lib/toast';
import type { Tokens } from '@/lib/tokens';
import { Icon } from '@/components/Icon';

export const Toast = ({
  toast,
  t,
  onDismiss,
}: {
  toast: { msg: string; type: ToastType } | null;
  t: Tokens;
  onDismiss: () => void;
}) => {
  const pan = useRef(new RNAnimated.ValueXY()).current;
  const appear = useRef(new RNAnimated.Value(0)).current;
  const dismissRef = useRef(onDismiss);
  dismissRef.current = onDismiss;

  useEffect(() => {
    if (toast) {
      pan.setValue({ x: 0, y: 0 });
      appear.setValue(0);
      RNAnimated.spring(appear, {
        toValue: 1,
        useNativeDriver: true,
        friction: 9,
        tension: 80,
      }).start();
    }
  }, [toast, pan, appear]);

  const responder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_e, g) => Math.abs(g.dy) > 6 || Math.abs(g.dx) > 6,
      onPanResponderMove: (_e, g) => {
        // allow swiping up or sideways; don't let it drag down
        pan.setValue({ x: g.dx, y: Math.min(g.dy, 0) });
      },
      onPanResponderRelease: (_e, g) => {
        const up = g.dy < -50;
        const side = Math.abs(g.dx) > 90;
        if (up || side) {
          RNAnimated.timing(pan, {
            toValue: { x: side ? (g.dx > 0 ? 600 : -600) : 0, y: up ? -220 : 0 },
            duration: 180,
            useNativeDriver: true,
          }).start(() => dismissRef.current());
        } else {
          RNAnimated.spring(pan, {
            toValue: { x: 0, y: 0 },
            useNativeDriver: true,
            friction: 9,
          }).start();
        }
      },
    }),
  ).current;

  if (!toast) return null;
  const cfg = {
    success: { icon: 'check' as const, color: t.income },
    error: { icon: 'close' as const, color: t.expense },
    info: { icon: 'info' as const, color: t.accent },
  }[toast.type];
  const entranceY = appear.interpolate({ inputRange: [0, 1], outputRange: [-18, 0] });
  return (
    <View
      pointerEvents="box-none"
      style={{ position: 'absolute', top: 54, left: 16, right: 16, zIndex: 200 }}
    >
      <RNAnimated.View
        {...responder.panHandlers}
        style={{
          opacity: appear,
          transform: [{ translateX: pan.x }, { translateY: RNAnimated.add(pan.y, entranceY) }],
        }}
      >
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 11,
            backgroundColor: t.sheetBg,
            paddingVertical: 12,
            paddingLeft: 14,
            paddingRight: 8,
            borderRadius: 18,
            borderWidth: StyleSheet.hairlineWidth,
            borderColor: t.border,
            shadowColor: '#000',
            shadowOpacity: t.dark ? 0.4 : 0.16,
            shadowRadius: 24,
            shadowOffset: { width: 0, height: 10 },
            elevation: 10,
          }}
        >
          <View
            style={{
              width: 28,
              height: 28,
              borderRadius: 14,
              backgroundColor: cfg.color + '22',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon name={cfg.icon} size={16} color={cfg.color} stroke={2.8} />
          </View>
          <Text
            style={{ flex: 1, color: t.text, fontSize: 14, fontWeight: '600' }}
            numberOfLines={3}
          >
            {toast.msg}
          </Text>
          <Pressable
            onPress={() => dismissRef.current()}
            hitSlop={10}
            style={{
              width: 28,
              height: 28,
              borderRadius: 14,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon name="close" size={14} color={t.textTer} stroke={2.6} />
          </Pressable>
        </View>
      </RNAnimated.View>
    </View>
  );
};
