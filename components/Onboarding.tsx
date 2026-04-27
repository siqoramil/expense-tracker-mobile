import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Pressable, Text, View } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { tStr } from '../lib/i18n';
import { store } from '../lib/store';
import type { Tokens } from '../lib/tokens';

type Slide = {
  key: string;
  titleHead: string;
  titleAccent: string;
  render: (t: Tokens) => React.ReactNode;
};

const slidesFor = (lang: string): Omit<Slide, 'render'>[] =>
  lang === 'uz'
    ? [
        { key: 'salary', titleHead: 'Xarajatlaringizni', titleAccent: 'boshqaring' },
        { key: 'debtors', titleHead: 'Qarzlaringizni esda', titleAccent: 'saqlang' },
        { key: 'savings', titleHead: 'Jamg‘armangizni', titleAccent: 'ko‘paytiring' },
      ]
    : [
        { key: 'salary', titleHead: 'Track every', titleAccent: 'expense' },
        { key: 'debtors', titleHead: 'Never forget', titleAccent: 'who owes you' },
        { key: 'savings', titleHead: 'Grow your', titleAccent: 'savings' },
      ];

export const Onboarding: React.FC<{ t: Tokens; onDone: () => void }> = ({ t, onDone }) => {
  const [i, setI] = useState(0);
  const lang = store.get().prefs.lang;
  const meta = slidesFor(lang);

  const renders: Record<string, (t: Tokens) => React.ReactNode> = {
    salary: (tok) => <PiggyWithIcons t={tok} />,
    debtors: (tok) => <PiggyWithPerson t={tok} />,
    savings: (tok) => <PiggyWithCoin t={tok} />,
  };
  const slides: Slide[] = meta.map((s) => ({ ...s, render: renders[s.key] }));
  const cur = slides[i];

  const fade = useRef(new Animated.Value(1)).current;
  const slideX = useRef(new Animated.Value(0)).current;
  const textY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fade.setValue(0);
    slideX.setValue(28);
    textY.setValue(14);
    Animated.parallel([
      Animated.timing(fade, {
        toValue: 1,
        duration: 360,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.spring(slideX, { toValue: 0, damping: 14, stiffness: 130, useNativeDriver: true }),
      Animated.timing(textY, {
        toValue: 0,
        duration: 420,
        delay: 80,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [i, fade, slideX, textY]);

  const isLast = i === slides.length - 1;
  const next = () => (isLast ? onDone() : setI(i + 1));
  const skip = onDone;

  const buttonLabel = isLast
    ? lang === 'uz'
      ? 'Boshlash'
      : 'Get started'
    : lang === 'uz'
      ? 'Keyingi'
      : 'Next';

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: t.bg,
        paddingHorizontal: 28,
        paddingTop: 18,
        paddingBottom: 28,
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: 28,
        }}
      >
        <View style={{ flexDirection: 'row', gap: 6 }}>
          {slides.map((_, j) => (
            <Dot key={j} active={j === i} t={t} />
          ))}
        </View>
        {!isLast ? (
          <Pressable hitSlop={12} onPress={skip}>
            <Text style={{ color: t.textSec, fontSize: 15, fontWeight: '500' }}>
              {tStr(lang, 'skip')}
            </Text>
          </Pressable>
        ) : (
          <View style={{ width: 1 }} />
        )}
      </View>

      <Animated.View
        style={{
          marginTop: 28,
          opacity: fade,
          transform: [{ translateX: slideX }, { translateY: textY }],
        }}
      >
        <Text
          style={{
            fontSize: 34,
            fontWeight: '800',
            color: t.text,
            letterSpacing: -1,
            lineHeight: 40,
          }}
        >
          {cur.titleHead}{' '}
          <Text style={{ color: t.accent }}>{cur.titleAccent}</Text>
        </Text>
      </Animated.View>

      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Animated.View style={{ opacity: fade, transform: [{ translateX: slideX }] }}>
          {cur.render(t)}
        </Animated.View>
      </View>

      <Pressable
        onPress={next}
        style={({ pressed }) => [
          {
            height: 56,
            borderRadius: 16,
            backgroundColor: t.accent,
            alignItems: 'center',
            justifyContent: 'center',
            shadowColor: t.accent,
            shadowOpacity: 0.25,
            shadowRadius: 16,
            shadowOffset: { width: 0, height: 8 },
            elevation: 5,
          },
          pressed && { transform: [{ scale: 0.98 }], opacity: 0.95 },
        ]}
      >
        <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700', letterSpacing: 0.2 }}>
          {buttonLabel}
        </Text>
      </Pressable>
    </View>
  );
};

const Dot: React.FC<{ active: boolean; t: Tokens }> = ({ active, t }) => {
  const w = useRef(new Animated.Value(active ? 22 : 7)).current;
  useEffect(() => {
    Animated.spring(w, {
      toValue: active ? 22 : 7,
      damping: 14,
      stiffness: 160,
      useNativeDriver: false,
    }).start();
  }, [active, w]);
  return (
    <Animated.View
      style={{
        width: w,
        height: 7,
        borderRadius: 4,
        backgroundColor: active ? t.text : t.borderStrong,
      }}
    />
  );
};

// ─── Illustrations ─────────────────────────────────────────

const Piggy: React.FC<{ t: Tokens; size?: number }> = ({ t, size = 200 }) => {
  const stroke = t.text;
  const accent = t.accent;
  const sw = 4;
  return (
    <Svg width={size} height={size * 0.85} viewBox="0 0 220 190">
      {/* base/floor (legs sit on tinted block) */}
      <Path
        d="M48 152 H172 V162 Q172 168 166 168 H54 Q48 168 48 162 Z"
        fill={accent}
        opacity={0.85}
      />
      {/* body */}
      <Path
        d="M40 96
           Q40 56 96 50
           Q120 36 138 52
           Q176 60 180 100
           Q184 138 152 152
           H64
           Q40 144 40 110
           Z"
        fill={t.surface}
        stroke={stroke}
        strokeWidth={sw}
        strokeLinejoin="round"
      />
      {/* ear */}
      <Path
        d="M104 50 Q108 32 124 36 Q128 46 122 56"
        fill={t.surface}
        stroke={stroke}
        strokeWidth={sw}
        strokeLinejoin="round"
      />
      {/* snout */}
      <Path
        d="M28 102
           Q22 100 22 110
           Q22 124 32 124
           Q42 128 50 122"
        fill={t.surface}
        stroke={stroke}
        strokeWidth={sw}
        strokeLinejoin="round"
      />
      <Circle cx={29} cy={110} r={2.5} fill={stroke} />
      <Circle cx={29} cy={119} r={2.5} fill={stroke} />
      {/* eye */}
      <Circle cx={64} cy={86} r={3.5} fill={stroke} />
      {/* slot */}
      <Path
        d="M118 70 H148"
        stroke={stroke}
        strokeWidth={sw}
        strokeLinecap="round"
      />
      {/* tail curl */}
      <Path
        d="M178 102 Q190 96 188 110 Q186 122 176 118"
        fill="none"
        stroke={stroke}
        strokeWidth={sw}
        strokeLinecap="round"
      />
      {/* legs */}
      <Path d="M70 152 V164" stroke={stroke} strokeWidth={sw} strokeLinecap="round" />
      <Path d="M150 152 V164" stroke={stroke} strokeWidth={sw} strokeLinecap="round" />
    </Svg>
  );
};

const PiggyWithIcons: React.FC<{ t: Tokens }> = ({ t }) => {
  const float = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(float, {
          toValue: 1,
          duration: 2400,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(float, {
          toValue: 0,
          duration: 2400,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [float]);
  const ty = float.interpolate({ inputRange: [0, 1], outputRange: [0, -6] });

  return (
    <View style={{ width: 320, height: 300, alignItems: 'center', justifyContent: 'center' }}>
      <Svg
        width={320}
        height={300}
        viewBox="0 0 320 300"
        style={{ position: 'absolute', top: 0, left: 0 }}
      >
        <Path
          d="M70 220 Q160 280 250 220"
          stroke={t.borderStrong}
          strokeWidth={1.5}
          strokeDasharray="4 6"
          fill="none"
          strokeLinecap="round"
        />
      </Svg>
      <Animated.View style={{ transform: [{ translateY: ty }] }}>
        <Piggy t={t} size={210} />
      </Animated.View>

      <View
        style={{
          position: 'absolute',
          left: 32,
          bottom: 18,
          ...iconBubble,
          backgroundColor: '#67C7C2',
        }}
      >
        <Text style={{ color: '#fff', fontWeight: '700', fontSize: 11 }}>FOOD</Text>
      </View>
      <View
        style={{
          position: 'absolute',
          left: '50%',
          marginLeft: -22,
          bottom: -2,
          ...iconBubble,
          backgroundColor: '#1F2937',
        }}
      >
        <Svg width={20} height={20} viewBox="0 0 24 24">
          <Path
            d="M12 3 L8 8 H10 V14 H14 V8 H16 Z M6 16 H18 V20 H6 Z"
            fill="#fff"
          />
        </Svg>
      </View>
      <View
        style={{
          position: 'absolute',
          right: 32,
          bottom: 18,
          ...iconBubble,
          backgroundColor: '#E2574C',
        }}
      >
        <Text style={{ color: '#fff', fontWeight: '700', fontSize: 14 }}>$</Text>
      </View>
    </View>
  );
};

const PiggyWithPerson: React.FC<{ t: Tokens }> = ({ t }) => {
  const sparkle = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(sparkle, {
          toValue: 1,
          duration: 1400,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(sparkle, {
          toValue: 0,
          duration: 1400,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [sparkle]);

  return (
    <View style={{ width: 280, height: 280, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={260} height={260} viewBox="0 0 260 260">
        {/* head */}
        <Circle cx={130} cy={70} r={36} fill={t.surface} stroke={t.text} strokeWidth={4} />
        {/* hair */}
        <Path
          d="M100 56 Q108 30 132 32 Q160 32 164 60 Q150 52 130 54 Q112 56 100 70 Z"
          fill={t.text}
        />
        {/* eyes */}
        <Circle cx={120} cy={74} r={2.6} fill={t.text} />
        <Circle cx={140} cy={74} r={2.6} fill={t.text} />
        {/* smile */}
        <Path
          d="M120 86 Q130 94 140 86"
          stroke={t.text}
          strokeWidth={3}
          fill="none"
          strokeLinecap="round"
        />
        {/* body / shirt */}
        <Path
          d="M82 200
             Q80 144 110 122
             L130 134
             L150 122
             Q180 144 178 200
             Z"
          fill={t.surface}
          stroke={t.text}
          strokeWidth={4}
          strokeLinejoin="round"
        />
        {/* tie */}
        <Path d="M124 122 L130 154 L136 122 Z" fill={t.accent} />
        <Path d="M130 154 L122 200 L138 200 L130 154 Z" fill={t.accent} />
        {/* arms holding phone */}
        <Path
          d="M104 168 Q120 158 130 170 Q140 158 156 168"
          stroke={t.text}
          strokeWidth={4}
          fill="none"
          strokeLinecap="round"
        />
        {/* phone */}
        <Rect
          x={116}
          y={156}
          width={28}
          height={42}
          rx={4}
          fill={t.text}
        />
        <Rect x={120} y={161} width={20} height={26} rx={2} fill={t.surface} />
      </Svg>

      <Animated.View
        style={{
          position: 'absolute',
          top: 20,
          right: 30,
          opacity: sparkle,
          transform: [
            { scale: sparkle.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1.1] }) },
          ],
        }}
      >
        <Sparkle color={t.accent} size={20} />
      </Animated.View>
      <Animated.View
        style={{
          position: 'absolute',
          top: 60,
          left: 18,
          opacity: sparkle.interpolate({ inputRange: [0, 1], outputRange: [1, 0.3] }),
          transform: [
            { scale: sparkle.interpolate({ inputRange: [0, 1], outputRange: [1, 0.6] }) },
          ],
        }}
      >
        <Sparkle color={t.accent} size={14} />
      </Animated.View>
      <Animated.View
        style={{
          position: 'absolute',
          bottom: 30,
          right: 20,
          opacity: sparkle,
        }}
      >
        <Sparkle color={t.accent} size={16} />
      </Animated.View>
    </View>
  );
};

const PiggyWithCoin: React.FC<{ t: Tokens }> = ({ t }) => {
  const drop = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(drop, {
          toValue: 1,
          duration: 1800,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.delay(400),
        Animated.timing(drop, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [drop]);

  const tx = drop.interpolate({ inputRange: [0, 1], outputRange: [-90, 30] });
  const ty = drop.interpolate({ inputRange: [0, 0.4, 1], outputRange: [0, -30, 60] });
  const op = drop.interpolate({ inputRange: [0, 0.05, 0.9, 1], outputRange: [0, 1, 1, 0] });

  return (
    <View style={{ width: 300, height: 300, alignItems: 'center', justifyContent: 'center' }}>
      <Svg
        width={300}
        height={300}
        viewBox="0 0 300 300"
        style={{ position: 'absolute', top: 0, left: 0 }}
      >
        <Path
          d="M70 80 Q150 40 220 130"
          stroke={t.text}
          strokeWidth={1.5}
          strokeDasharray="3 5"
          fill="none"
          strokeLinecap="round"
        />
      </Svg>

      <Animated.View
        style={{
          position: 'absolute',
          top: 40,
          left: '50%',
          marginLeft: -18,
          opacity: op,
          transform: [{ translateX: tx }, { translateY: ty }],
        }}
      >
        <Coin color={t.accent} stroke={t.text} size={36} />
      </Animated.View>

      <View style={{ marginTop: 30 }}>
        <Piggy t={t} size={220} />
      </View>
    </View>
  );
};

const Coin: React.FC<{ color: string; stroke: string; size: number }> = ({
  color,
  stroke,
  size,
}) => (
  <Svg width={size} height={size} viewBox="0 0 36 36">
    <Circle cx={18} cy={18} r={15} fill={color} stroke={stroke} strokeWidth={2.5} />
    <Path
      d="M14 14 H22 M13 18 H21 M14 22 H20"
      stroke="#fff"
      strokeWidth={2.2}
      strokeLinecap="round"
      fill="none"
    />
  </Svg>
);

const Sparkle: React.FC<{ color: string; size: number }> = ({ color, size }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Path d="M12 2 L13.5 10.5 L22 12 L13.5 13.5 L12 22 L10.5 13.5 L2 12 L10.5 10.5 Z" fill={color} />
  </Svg>
);

const iconBubble = {
  width: 44,
  height: 44,
  borderRadius: 22,
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
  borderWidth: 3,
  borderColor: '#fff',
  shadowColor: '#000',
  shadowOpacity: 0.12,
  shadowRadius: 8,
  shadowOffset: { width: 0, height: 4 },
  elevation: 3,
};

