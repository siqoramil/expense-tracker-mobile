import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Pressable, Text, View } from 'react-native';
import Svg, { Circle, Defs, G, LinearGradient, Path, Rect, Stop } from 'react-native-svg';
import { tStr } from '../lib/i18n';
import { store } from '../lib/store';
import type { Tokens } from '../lib/tokens';

type Slide = {
  key: string;
  color: string;
  tint: string;
  title: string;
  sub: string;
  render: (t: Tokens) => React.ReactNode;
};

export const Onboarding: React.FC<{ t: Tokens; onDone: () => void }> = ({ t, onDone }) => {
  const [i, setI] = useState(0);
  const lang = store.get().prefs.lang;

  const slides: Slide[] = [
    {
      key: 'salary',
      color: '#6366F1',
      tint: '#A5B4FC',
      title: tStr(lang, 'trackSalary'),
      sub: tStr(lang, 'trackSalarySub'),
      render: () => <SalaryArt color="#6366F1" accent="#F59E0B" />,
    },
    {
      key: 'debtors',
      color: '#10B981',
      tint: '#6EE7B7',
      title: tStr(lang, 'manageDebtors'),
      sub: tStr(lang, 'manageDebtorsSub'),
      render: () => <DebtorsArt />,
    },
    {
      key: 'savings',
      color: '#F59E0B',
      tint: '#FCD34D',
      title: tStr(lang, 'staySavings'),
      sub: tStr(lang, 'staySavingsSub'),
      render: () => <SavingsArt color="#F59E0B" />,
    },
  ];
  const cur = slides[i];

  const fade = useRef(new Animated.Value(1)).current;
  const slideX = useRef(new Animated.Value(0)).current;
  const artScale = useRef(new Animated.Value(0.8)).current;
  const artRotate = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0)).current;
  const textY = useRef(new Animated.Value(16)).current;
  const textFade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 2800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 2800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ]),
    ).start();
  }, [pulse]);

  useEffect(() => {
    fade.setValue(0);
    slideX.setValue(40);
    artScale.setValue(0.72);
    artRotate.setValue(-0.08);
    textY.setValue(20);
    textFade.setValue(0);
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 380, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.spring(slideX, { toValue: 0, damping: 14, stiffness: 120, useNativeDriver: true }),
      Animated.spring(artScale, { toValue: 1, damping: 10, stiffness: 110, useNativeDriver: true }),
      Animated.spring(artRotate, { toValue: 0, damping: 12, stiffness: 110, useNativeDriver: true }),
      Animated.timing(textY, { toValue: 0, duration: 480, delay: 140, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(textFade, { toValue: 1, duration: 480, delay: 140, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();
  }, [i, fade, slideX, artScale, artRotate, textY, textFade]);

  const next = () => (i < slides.length - 1 ? setI(i + 1) : onDone());
  const skip = () => onDone();

  const pulseScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.18] });
  const pulseOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0.05] });
  const rotateDeg = artRotate.interpolate({ inputRange: [-1, 1], outputRange: ['-15deg', '15deg'] });

  return (
    <View style={{ flex: 1, backgroundColor: t.bg, paddingHorizontal: 28, paddingTop: 20, paddingBottom: 24 }}>
      <View style={{ alignItems: 'flex-end' }}>
        <Pressable hitSlop={12} onPress={skip}>
          <Text style={{ color: t.textSec, fontSize: 15, fontWeight: '500' }}>
            {tStr(lang, 'skip')}
          </Text>
        </Pressable>
      </View>

      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <View style={{ alignItems: 'center', justifyContent: 'center', height: 280, width: '100%' }}>
          <Animated.View
            pointerEvents="none"
            style={{
              position: 'absolute',
              width: 260,
              height: 260,
              borderRadius: 130,
              backgroundColor: cur.color,
              opacity: pulseOpacity,
              transform: [{ scale: pulseScale }],
            }}
          />
          <Animated.View
            pointerEvents="none"
            style={{
              position: 'absolute',
              width: 200,
              height: 200,
              borderRadius: 100,
              backgroundColor: cur.tint,
              opacity: 0.22,
            }}
          />
          <Animated.View
            style={{
              opacity: fade,
              transform: [{ translateX: slideX }, { scale: artScale }, { rotate: rotateDeg }],
            }}
          >
            {cur.render(t)}
          </Animated.View>
        </View>

        <Animated.View
          style={{
            alignItems: 'center',
            maxWidth: 320,
            marginTop: 36,
            opacity: textFade,
            transform: [{ translateY: textY }],
          }}
        >
          <Text
            style={{
              fontSize: 28,
              fontWeight: '700',
              color: t.text,
              marginBottom: 10,
              letterSpacing: -0.6,
              textAlign: 'center',
            }}
          >
            {cur.title}
          </Text>
          <Text style={{ fontSize: 15, color: t.textSec, lineHeight: 22, textAlign: 'center' }}>
            {cur.sub}
          </Text>
        </Animated.View>

        <View style={{ flexDirection: 'row', gap: 6, marginTop: 28 }}>
          {slides.map((_, j) => (
            <Dot key={j} active={j === i} color={cur.color} base={t.border} />
          ))}
        </View>
      </View>

      <Pressable
        onPress={next}
        style={({ pressed }) => [
          {
            padding: 16,
            borderRadius: 18,
            backgroundColor: cur.color,
            alignItems: 'center',
            shadowColor: cur.color,
            shadowOpacity: 0.35,
            shadowRadius: 18,
            shadowOffset: { width: 0, height: 8 },
            elevation: 6,
          },
          pressed && { transform: [{ scale: 0.97 }] },
        ]}
      >
        <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600', letterSpacing: 0.2 }}>
          {i < slides.length - 1 ? tStr(lang, 'next') : tStr(lang, 'getStarted')}
        </Text>
      </Pressable>
    </View>
  );
};

const Dot: React.FC<{ active: boolean; color: string; base: string }> = ({ active, color, base }) => {
  const w = useRef(new Animated.Value(active ? 24 : 6)).current;
  useEffect(() => {
    Animated.spring(w, { toValue: active ? 24 : 6, damping: 14, stiffness: 160, useNativeDriver: false }).start();
  }, [active, w]);
  return (
    <Animated.View
      style={{
        width: w,
        height: 6,
        borderRadius: 3,
        backgroundColor: active ? color : base,
      }}
    />
  );
};

// ─── Illustrations ─────────────────────────────────────────

const SalaryArt: React.FC<{ color: string; accent: string }> = ({ color, accent }) => {
  const coin = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(coin, { toValue: 1, duration: 1400, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(coin, { toValue: 0, duration: 1400, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]),
    ).start();
  }, [coin]);

  const coinY = coin.interpolate({ inputRange: [0, 1], outputRange: [0, -10] });
  const coinY2 = coin.interpolate({ inputRange: [0, 1], outputRange: [-4, 6] });
  const coinY3 = coin.interpolate({ inputRange: [0, 1], outputRange: [4, -8] });

  return (
    <View style={{ width: 220, height: 220, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View style={{ position: 'absolute', top: 10, left: 20, transform: [{ translateY: coinY }] }}>
        <Coin size={36} color={accent} />
      </Animated.View>
      <Animated.View style={{ position: 'absolute', top: 30, right: 22, transform: [{ translateY: coinY2 }] }}>
        <Coin size={28} color={accent} />
      </Animated.View>
      <Animated.View style={{ position: 'absolute', top: 0, right: 70, transform: [{ translateY: coinY3 }] }}>
        <Coin size={22} color={accent} />
      </Animated.View>

      <Svg width={180} height={140} viewBox="0 0 180 140">
        <Defs>
          <LinearGradient id="wg" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={color} stopOpacity="1" />
            <Stop offset="1" stopColor="#8B5CF6" stopOpacity="1" />
          </LinearGradient>
        </Defs>
        <G>
          <Rect x="14" y="30" width="152" height="94" rx="18" fill="#fff" opacity="0.5" />
          <Rect x="8" y="22" width="152" height="94" rx="18" fill="url(#wg)" />
          <Rect x="20" y="38" width="60" height="10" rx="5" fill="rgba(255,255,255,0.55)" />
          <Rect x="20" y="56" width="100" height="18" rx="9" fill="rgba(255,255,255,0.85)" />
          <Circle cx="134" cy="92" r="12" fill="rgba(255,255,255,0.85)" />
          <Circle cx="118" cy="92" r="12" fill="rgba(255,255,255,0.55)" />
        </G>
      </Svg>
    </View>
  );
};

const Coin: React.FC<{ size: number; color: string }> = ({ size, color }) => (
  <Svg width={size} height={size} viewBox="0 0 40 40">
    <Defs>
      <LinearGradient id="cg" x1="0" y1="0" x2="0" y2="1">
        <Stop offset="0" stopColor="#FFD36B" />
        <Stop offset="1" stopColor={color} />
      </LinearGradient>
    </Defs>
    <Circle cx="20" cy="20" r="18" fill="url(#cg)" stroke="#fff" strokeWidth="2" />
    <Path
      d="M20 10v4M20 26v4M16 14h7a3 3 0 010 6h-6a3 3 0 000 6h7"
      stroke="#fff"
      strokeWidth="2.5"
      strokeLinecap="round"
      fill="none"
    />
  </Svg>
);

const DebtorsArt: React.FC = () => {
  const p1 = useRef(new Animated.Value(0)).current;
  const p2 = useRef(new Animated.Value(0)).current;
  const p3 = useRef(new Animated.Value(0)).current;
  const flow = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.stagger(160, [
      Animated.spring(p1, { toValue: 1, damping: 9, stiffness: 110, useNativeDriver: true }),
      Animated.spring(p2, { toValue: 1, damping: 9, stiffness: 110, useNativeDriver: true }),
      Animated.spring(p3, { toValue: 1, damping: 9, stiffness: 110, useNativeDriver: true }),
    ]).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(flow, { toValue: 1, duration: 1800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(flow, { toValue: 0, duration: 1800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ]),
    ).start();
  }, [p1, p2, p3, flow]);

  const flowY = flow.interpolate({ inputRange: [0, 1], outputRange: [-6, 6] });
  const flowOpacity = flow.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.4, 1, 0.4] });

  return (
    <View style={{ width: 260, height: 220, alignItems: 'center', justifyContent: 'center' }}>
      <View style={{ position: 'absolute', width: 260, height: 260 }}>
        <Svg width={260} height={260} viewBox="0 0 260 260">
          <Path
            d="M70 140 Q130 90 190 140"
            stroke="rgba(16,185,129,0.25)"
            strokeWidth="2"
            strokeDasharray="4 6"
            strokeLinecap="round"
            fill="none"
          />
          <Path
            d="M70 140 Q130 190 190 140"
            stroke="rgba(16,185,129,0.25)"
            strokeWidth="2"
            strokeDasharray="4 6"
            strokeLinecap="round"
            fill="none"
          />
        </Svg>
      </View>

      <Animated.View
        style={{
          position: 'absolute',
          left: 18,
          top: 70,
          transform: [
            { scale: p1 },
            { translateY: p1.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) },
          ],
          opacity: p1,
        }}
      >
        <PersonCard color="#6366F1" initials="AK" amount="+2.5M" size={90} />
      </Animated.View>

      <Animated.View
        style={{
          transform: [
            { scale: p2 },
            { translateY: p2.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) },
          ],
          opacity: p2,
          zIndex: 3,
        }}
      >
        <PersonCard color="#EC4899" initials="DR" amount="+750K" size={108} primary />
      </Animated.View>

      <Animated.View
        style={{
          position: 'absolute',
          right: 18,
          top: 70,
          transform: [
            { scale: p3 },
            { translateY: p3.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) },
          ],
          opacity: p3,
        }}
      >
        <PersonCard color="#F59E0B" initials="JT" amount="+1.2M" size={90} />
      </Animated.View>

      <Animated.View
        style={{
          position: 'absolute',
          left: 86,
          bottom: 28,
          opacity: flowOpacity,
          transform: [{ translateY: flowY }],
        }}
      >
        <MoneyBadge />
      </Animated.View>
      <Animated.View
        style={{
          position: 'absolute',
          right: 86,
          bottom: 28,
          opacity: flowOpacity,
          transform: [{ translateY: flowY }],
        }}
      >
        <MoneyBadge />
      </Animated.View>
    </View>
  );
};

const PersonCard: React.FC<{
  color: string;
  initials: string;
  amount: string;
  size: number;
  primary?: boolean;
}> = ({ color, initials, amount, size, primary }) => (
  <View
    style={{
      alignItems: 'center',
      padding: primary ? 10 : 8,
      borderRadius: size / 2 + 10,
      backgroundColor: '#fff',
      shadowColor: color,
      shadowOpacity: primary ? 0.35 : 0.22,
      shadowRadius: primary ? 20 : 12,
      shadowOffset: { width: 0, height: primary ? 10 : 6 },
      elevation: primary ? 8 : 4,
    }}
  >
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: color,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text
        style={{
          color: '#fff',
          fontSize: size * 0.38,
          fontWeight: '700',
          letterSpacing: -0.5,
        }}
      >
        {initials}
      </Text>
    </View>
    <View
      style={{
        marginTop: -8,
        paddingVertical: 3,
        paddingHorizontal: 9,
        borderRadius: 10,
        backgroundColor: color,
      }}
    >
      <Text style={{ color: '#fff', fontSize: primary ? 12 : 10, fontWeight: '700' }}>
        {amount}
      </Text>
    </View>
  </View>
);

const MoneyBadge: React.FC = () => (
  <Svg width={34} height={34} viewBox="0 0 34 34">
    <Defs>
      <LinearGradient id="mg" x1="0" y1="0" x2="0" y2="1">
        <Stop offset="0" stopColor="#34D399" />
        <Stop offset="1" stopColor="#10B981" />
      </LinearGradient>
    </Defs>
    <Circle cx="17" cy="17" r="15" fill="url(#mg)" stroke="#fff" strokeWidth="2" />
    <Path
      d="M17 9v3M17 22v3M13 13h5.5a2.5 2.5 0 010 5h-4a2.5 2.5 0 000 5H20"
      stroke="#fff"
      strokeWidth="2.2"
      strokeLinecap="round"
      fill="none"
    />
  </Svg>
);

const SavingsArt: React.FC<{ color: string }> = ({ color }) => {
  const bars = [useRef(new Animated.Value(0)).current, useRef(new Animated.Value(0)).current, useRef(new Animated.Value(0)).current, useRef(new Animated.Value(0)).current];
  const arrow = useRef(new Animated.Value(0)).current;
  const twinkle = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.stagger(
      120,
      bars.map((b) =>
        Animated.spring(b, { toValue: 1, damping: 10, stiffness: 120, useNativeDriver: true }),
      ),
    ).start();
    Animated.spring(arrow, { toValue: 1, damping: 10, stiffness: 110, useNativeDriver: true }).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(twinkle, { toValue: 1, duration: 1200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(twinkle, { toValue: 0, duration: 1200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]),
    ).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const heights = [50, 80, 110, 150];
  const barColors = ['#FDE68A', '#FCD34D', '#FBBF24', '#F59E0B'];

  return (
    <View style={{ width: 220, height: 200, alignItems: 'center', justifyContent: 'flex-end' }}>
      <Animated.View
        style={{
          position: 'absolute',
          top: 4,
          right: 16,
          opacity: twinkle,
          transform: [{ scale: twinkle.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1.1] }) }],
        }}
      >
        <Sparkle color={color} size={22} />
      </Animated.View>
      <Animated.View
        style={{
          position: 'absolute',
          top: 40,
          left: 10,
          opacity: twinkle.interpolate({ inputRange: [0, 1], outputRange: [0.9, 0.3] }),
          transform: [{ scale: twinkle.interpolate({ inputRange: [0, 1], outputRange: [1, 0.7] }) }],
        }}
      >
        <Sparkle color={color} size={14} />
      </Animated.View>

      <Animated.View
        style={{
          position: 'absolute',
          top: 10,
          left: 40,
          opacity: arrow,
          transform: [
            { translateX: arrow.interpolate({ inputRange: [0, 1], outputRange: [40, 0] }) },
            { translateY: arrow.interpolate({ inputRange: [0, 1], outputRange: [-40, 0] }) },
          ],
        }}
      >
        <Svg width={160} height={90} viewBox="0 0 160 90">
          <Path
            d="M4 78 C 40 60, 70 40, 120 12"
            stroke={color}
            strokeWidth="5"
            strokeLinecap="round"
            fill="none"
          />
          <Path d="M110 8 L128 8 L124 26 Z" fill={color} />
        </Svg>
      </Animated.View>

      <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 14, marginBottom: 4 }}>
        {heights.map((h, idx) => (
          <Animated.View
            key={idx}
            style={{
              width: 28,
              height: h,
              borderRadius: 10,
              backgroundColor: barColors[idx],
              opacity: bars[idx],
              transform: [{ scaleY: bars[idx] }],
              transformOrigin: 'bottom',
              shadowColor: barColors[idx],
              shadowOpacity: 0.35,
              shadowRadius: 10,
              shadowOffset: { width: 0, height: 4 },
            }}
          />
        ))}
      </View>
      <View style={{ width: 180, height: 3, borderRadius: 2, backgroundColor: 'rgba(0,0,0,0.08)' }} />
    </View>
  );
};

const Sparkle: React.FC<{ color: string; size: number }> = ({ color, size }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Path
      d="M12 2l2 8 8 2-8 2-2 8-2-8-8-2 8-2z"
      fill={color}
    />
  </Svg>
);
