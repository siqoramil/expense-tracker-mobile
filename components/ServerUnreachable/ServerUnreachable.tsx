import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StatusBar, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Defs, Line, Path, RadialGradient, Stop } from 'react-native-svg';
import type { Tokens } from '@/lib/tokens';
import { Button } from '@/components/ui';
import { authApi, getServerStatus, subscribeServerStatus } from '@/lib/api';
import { tStr, type Lang } from '@/lib/i18n';

type Props = {
  t: Tokens;
  lang: Lang;
};

const ILLU = 200;

// Three signal rings that keep expanding and fading outward — the app "reaching
// out" for a server that never answers back. Rings are evenly offset by a third
// of the period so there is always a wave in flight.
const SignalRings = ({ color }: { color: string }) => {
  const waves = useRef([0, 1, 2].map(() => new Animated.Value(0))).current;

  useEffect(() => {
    const DURATION = 2600;
    const stagger = DURATION / waves.length;
    const loops = waves.map((v) =>
      Animated.loop(
        Animated.timing(v, {
          toValue: 1,
          duration: DURATION,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ),
    );
    const timers = loops.map((l, i) => setTimeout(() => l.start(), i * stagger));
    return () => {
      timers.forEach(clearTimeout);
      loops.forEach((l) => l.stop());
    };
  }, [waves]);

  return (
    <>
      {waves.map((v, i) => (
        <Animated.View
          key={i}
          pointerEvents="none"
          style={[
            styles.ring,
            {
              borderColor: color,
              opacity: v.interpolate({ inputRange: [0, 0.08, 0.9, 1], outputRange: [0, 0.32, 0, 0] }),
              transform: [{ scale: v.interpolate({ inputRange: [0, 1], outputRange: [0.55, 1.15] }) }],
            },
          ]}
        />
      ))}
    </>
  );
};

// The whole illustration breathes: a slow vertical bob so the "offline cloud"
// feels like it is floating, not frozen.
const useBob = () => {
  const bob = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(bob, { toValue: 1, duration: 2200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(bob, { toValue: 0, duration: 2200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [bob]);
  return bob.interpolate({ inputRange: [0, 1], outputRange: [0, -10] });
};

const OfflineCloud = ({ t }: { t: Tokens }) => {
  const translateY = useBob();

  return (
    <Animated.View style={{ transform: [{ translateY }] }}>
      <Svg width={ILLU} height={ILLU} viewBox="0 0 200 200">
        <Defs>
          <RadialGradient id="glow" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor={t.expense} stopOpacity={t.dark ? 0.22 : 0.14} />
            <Stop offset="100%" stopColor={t.expense} stopOpacity={0} />
          </RadialGradient>
        </Defs>

        {/* Soft glow halo behind the cloud */}
        <Circle cx={100} cy={100} r={92} fill="url(#glow)" />
        <Circle cx={100} cy={100} r={58} fill={t.expenseSoft} />

        {/* Cloud body — Feather "cloud" path, scaled into the 200-grid */}
        <Path
          d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"
          transform="translate(52 60) scale(4)"
          fill={t.dark ? 'rgba(239,68,68,0.10)' : 'rgba(255,255,255,0.85)'}
          stroke={t.expense}
          strokeWidth={2}
          strokeLinejoin="round"
        />

        {/* Diagonal "off" slash — a background-colored stroke sits underneath the
            red one to punch a clean gap where it crosses the cloud outline. */}
        <Line x1={64} y1={66} x2={140} y2={132} stroke={t.bg} strokeWidth={9} strokeLinecap="round" />
        <Line x1={64} y1={66} x2={140} y2={132} stroke={t.expense} strokeWidth={4.5} strokeLinecap="round" />

        {/* Two small orbiting dots for a bit of life */}
        <Circle cx={150} cy={62} r={4.5} fill={t.expense} opacity={0.55} />
        <Circle cx={48} cy={128} r={3} fill={t.expense} opacity={0.4} />
      </Svg>
    </Animated.View>
  );
};

export const ServerUnreachable = ({ t, lang }: Props) => {
  const [visible, setVisible] = useState(getServerStatus() === 'unreachable');
  const [checking, setChecking] = useState<boolean>(false);

  useEffect(() => subscribeServerStatus((s) => setVisible(s === 'unreachable')), []);

  if (!visible) return null;

  const onRetry = async () => {
    if (checking) return;
    setChecking(true);
    try {
      await authApi.ping();
    } catch {
      // Ignore — subscribeServerStatus will keep `visible` true if still down.
    } finally {
      setChecking(false);
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: t.bg }]} pointerEvents="auto">
      <StatusBar barStyle={t.dark ? 'light-content' : 'dark-content'} />

      <View style={styles.illuWrap}>
        <SignalRings color={t.expense} />
        <OfflineCloud t={t} />
      </View>

      <Text style={[styles.title, { color: t.text }]}>{tStr(lang, 'serverDown_title')}</Text>
      <Text style={[styles.sub, { color: t.textSec }]}>{tStr(lang, 'serverDown_sub')}</Text>
      <Button
        t={t}
        label={tStr(lang, 'serverDown_retry')}
        onPress={onRetry}
        loading={checking}
        fullWidth={false}
        style={styles.button}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
    elevation: 9999,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  illuWrap: {
    width: ILLU,
    height: ILLU,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  ring: {
    position: 'absolute',
    width: ILLU,
    height: ILLU,
    borderRadius: ILLU / 2,
    borderWidth: 2,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.5,
    textAlign: 'center',
    marginBottom: 10,
  },
  sub: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 32,
  },
  button: {
    minWidth: 180,
    alignSelf: 'center',
  },
});
