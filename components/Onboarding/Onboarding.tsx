import React, { useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient as SvgLinearGradient, Path, RadialGradient, Rect, Stop, } from 'react-native-svg';
import type { Tokens } from '@/lib/tokens';
import { store } from '@/lib/store';
import { tStr } from '@/lib/i18n';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

type SlideMeta = {
  key: 'track' | 'debtors' | 'savings';
  title: string;
  accent: string;
  subtitle: string;
  // hue pair for the accent gradient on this slide
  hueA: string;
  hueB: string;
};

const slidesFor = (lang: string): SlideMeta[] =>
  lang === 'uz'
    ? [
        {
          key: 'track',
          title: 'Pulingiz qayerga',
          accent: 'ketmoqda',
          subtitle: 'Har bir xarajatni avtomatik kategoriyalang va kunlik tendensiyani kuzating.',
          hueA: '#8B5CF6',
          hueB: '#EC4899',
        },
        {
          key: 'debtors',
          title: 'Kim qarz olgan,',
          accent: 'unutmaydi',
          subtitle: 'Qarzlar va kreditlarni bir joyda saqlang — sanalar va eslatmalar bilan.',
          hueA: '#06B6D4',
          hueB: '#3B82F6',
        },
        {
          key: 'savings',
          title: "Jamg'armangiz",
          accent: "o'sib boradi",
          subtitle: 'Aqlli byudjet va maqsadlar bilan har oy yanada tejaymiz.',
          hueA: '#10B981',
          hueB: '#F59E0B',
        },
      ]
    : [
        {
          key: 'track',
          title: 'See where every',
          accent: 'dollar goes',
          subtitle: 'Auto-categorize each transaction and watch your spending patterns evolve.',
          hueA: '#8B5CF6',
          hueB: '#EC4899',
        },
        {
          key: 'debtors',
          title: 'Never forget',
          accent: 'who owes you',
          subtitle:
            'Track loans and IOUs in one place, with reminders that actually arrive on time.',
          hueA: '#06B6D4',
          hueB: '#3B82F6',
        },
        {
          key: 'savings',
          title: 'Grow what you',
          accent: 'set aside',
          subtitle:
            'Smart budgets and goals turn small habits into real savings — month after month.',
          hueA: '#10B981',
          hueB: '#F59E0B',
        },
      ];

export const Onboarding = ({ t, onDone }: { t: Tokens; onDone: () => void }) => {
  const [i, setI] = useState(0);
  const lang = store.get().prefs.lang;
  const slides = slidesFor(lang);
  const cur = slides[i];

  const fade = useRef(new Animated.Value(1)).current;
  const slideX = useRef(new Animated.Value(0)).current;
  const cardScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    fade.setValue(0);
    slideX.setValue(40);
    cardScale.setValue(0.92);
    Animated.parallel([
      Animated.timing(fade, {
        toValue: 1,
        duration: 420,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.spring(slideX, {
        toValue: 0,
        damping: 16,
        stiffness: 130,
        useNativeDriver: true,
      }),
      Animated.spring(cardScale, {
        toValue: 1,
        damping: 14,
        stiffness: 110,
        useNativeDriver: true,
      }),
    ]).start();
  }, [i, fade, slideX, cardScale]);

  const isLast = i === slides.length - 1;
  const next = () => (isLast ? onDone() : setI(i + 1));
  const skip = onDone;

  const buttonLabel = isLast ? tStr(lang, 'getStarted') : tStr(lang, 'next');

  return (
    <View style={[styles.root, { backgroundColor: t.bg }]}>
      <MeshBackground t={t} hueA={cur.hueA} hueB={cur.hueB} />
      <FloatingOrbs hueA={cur.hueA} hueB={cur.hueB} />

      <View style={styles.topBar}>
        <View style={styles.dotsRow}>
          {slides.map((_, j) => (
            <Dot key={j} active={j === i} hue={cur.hueA} t={t} />
          ))}
        </View>
        {!isLast ? (
          <Pressable hitSlop={14} onPress={skip} style={styles.skipBtn}>
            <Text style={[styles.skipText, { color: t.textSec }]}>{tStr(lang, 'skip')}</Text>
          </Pressable>
        ) : (
          <View style={{ width: 1 }} />
        )}
      </View>

      <View style={styles.heroWrap}>
        <Animated.View
          style={{
            opacity: fade,
            transform: [{ translateX: slideX }, { scale: cardScale }],
          }}
        >
          <SlideHero slide={cur} t={t} />
        </Animated.View>
      </View>

      <Animated.View
        style={[styles.textBlock, { opacity: fade, transform: [{ translateY: slideX }] }]}
      >
        <Text style={[styles.title, { color: t.text }]}>
          {cur.title} <GradientWord text={cur.accent} hueA={cur.hueA} hueB={cur.hueB} />
        </Text>
        <Text style={[styles.subtitle, { color: t.textSec }]}>{cur.subtitle}</Text>
      </Animated.View>

      <Pressable
        onPress={next}
        style={({ pressed }) => [
          styles.cta,
          pressed && { transform: [{ scale: 0.98 }], opacity: 0.96 },
        ]}
      >
        <Svg
          width="100%"
          height="100%"
          viewBox="0 0 300 56"
          preserveAspectRatio="none"
          style={StyleSheet.absoluteFill}
        >
          <Defs>
            <SvgLinearGradient id="ctaGrad" x1="0" y1="0" x2="1" y2="0">
              <Stop offset="0" stopColor={cur.hueA} />
              <Stop offset="1" stopColor={cur.hueB} />
            </SvgLinearGradient>
          </Defs>
          <Rect x={0} y={0} width={300} height={56} rx={20} fill="url(#ctaGrad)" />
        </Svg>
        <Text style={styles.ctaText}>{buttonLabel}</Text>
      </Pressable>
    </View>
  );
};

// ─── Mesh gradient background ──────────────────────────────────────────────

const MeshBackground = ({ t, hueA, hueB }: { t: Tokens; hueA: string; hueB: string }) => {
  const isDark = t.bg.startsWith('#0') || t.bg === '#0B0B0F';
  const baseOp = isDark ? 0.55 : 0.32;
  return (
    <Svg
      width={SCREEN_W}
      height={SCREEN_H}
      viewBox={`0 0 ${SCREEN_W} ${SCREEN_H}`}
      style={StyleSheet.absoluteFill}
    >
      <Defs>
        <RadialGradient id="meshA" cx="20%" cy="15%" r="55%">
          <Stop offset="0" stopColor={hueA} stopOpacity={baseOp} />
          <Stop offset="1" stopColor={hueA} stopOpacity={0} />
        </RadialGradient>
        <RadialGradient id="meshB" cx="85%" cy="25%" r="45%">
          <Stop offset="0" stopColor={hueB} stopOpacity={baseOp} />
          <Stop offset="1" stopColor={hueB} stopOpacity={0} />
        </RadialGradient>
        <RadialGradient id="meshC" cx="50%" cy="85%" r="60%">
          <Stop offset="0" stopColor={hueA} stopOpacity={baseOp * 0.65} />
          <Stop offset="1" stopColor={hueA} stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Rect x={0} y={0} width={SCREEN_W} height={SCREEN_H} fill="url(#meshA)" />
      <Rect x={0} y={0} width={SCREEN_W} height={SCREEN_H} fill="url(#meshB)" />
      <Rect x={0} y={0} width={SCREEN_W} height={SCREEN_H} fill="url(#meshC)" />
    </Svg>
  );
};

// ─── Floating orbs ─────────────────────────────────────────────────────────

const FloatingOrbs = ({ hueA, hueB }: { hueA: string; hueB: string }) => {
  const orb1 = useRef(new Animated.Value(0)).current;
  const orb2 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = (val: Animated.Value, duration: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(val, {
            toValue: 1,
            duration,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(val, {
            toValue: 0,
            duration,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ]),
      );
    loop(orb1, 4200).start();
    loop(orb2, 5400).start();
  }, [orb1, orb2]);

  const ty1 = orb1.interpolate({ inputRange: [0, 1], outputRange: [0, -22] });
  const ty2 = orb2.interpolate({ inputRange: [0, 1], outputRange: [0, 18] });

  return (
    <>
      <Animated.View
        pointerEvents="none"
        style={[
          styles.orb,
          {
            top: SCREEN_H * 0.18,
            left: -60,
            transform: [{ translateY: ty1 }],
          },
        ]}
      >
        <Svg width={200} height={200} viewBox="0 0 200 200">
          <Defs>
            <RadialGradient id="orb1" cx="50%" cy="50%" r="50%">
              <Stop offset="0" stopColor={hueA} stopOpacity={0.55} />
              <Stop offset="1" stopColor={hueA} stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Circle cx={100} cy={100} r={100} fill="url(#orb1)" />
        </Svg>
      </Animated.View>
      <Animated.View
        pointerEvents="none"
        style={[
          styles.orb,
          {
            top: SCREEN_H * 0.32,
            right: -70,
            transform: [{ translateY: ty2 }],
          },
        ]}
      >
        <Svg width={220} height={220} viewBox="0 0 220 220">
          <Defs>
            <RadialGradient id="orb2" cx="50%" cy="50%" r="50%">
              <Stop offset="0" stopColor={hueB} stopOpacity={0.5} />
              <Stop offset="1" stopColor={hueB} stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Circle cx={110} cy={110} r={110} fill="url(#orb2)" />
        </Svg>
      </Animated.View>
    </>
  );
};

// ─── Slide hero (glass card with content) ──────────────────────────────────

const SlideHero = ({ slide, t }: { slide: SlideMeta; t: Tokens }) => {
  const isDark = t.bg.startsWith('#0') || t.bg === '#0B0B0F';
  const glassFill = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.55)';
  const glassBorder = isDark ? 'rgba(255,255,255,0.14)' : 'rgba(255,255,255,0.85)';
  const innerText = isDark ? '#FAFAFA' : '#0A0A0A';
  const innerSub = isDark ? 'rgba(235,235,245,0.6)' : '#52525B';

  return (
    <View style={styles.heroBox}>
      {/* main glass card */}
      <View style={[styles.glassCard, { backgroundColor: glassFill, borderColor: glassBorder }]}>
        {slide.key === 'track' ? (
          <TrackPreview hueA={slide.hueA} hueB={slide.hueB} text={innerText} sub={innerSub} />
        ) : slide.key === 'debtors' ? (
          <DebtorPreview hueA={slide.hueA} hueB={slide.hueB} text={innerText} sub={innerSub} />
        ) : (
          <SavingsPreview hueA={slide.hueA} hueB={slide.hueB} text={innerText} sub={innerSub} />
        )}
      </View>

      {/* small floating chip top-right */}
      <View
        style={[
          styles.chip,
          { backgroundColor: glassFill, borderColor: glassBorder, top: -14, right: -10 },
        ]}
      >
        <View style={[styles.chipDot, { backgroundColor: slide.hueA }]} />
        <Text style={[styles.chipText, { color: innerText }]}>Live</Text>
      </View>

      {/* small floating chip bottom-left */}
      <View
        style={[
          styles.chip,
          { backgroundColor: glassFill, borderColor: glassBorder, bottom: -14, left: -8 },
        ]}
      >
        <Svg width={12} height={12} viewBox="0 0 24 24">
          <Path
            d="M5 12 L10 17 L20 7"
            stroke={slide.hueB}
            strokeWidth={3.5}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
        <Text style={[styles.chipText, { color: innerText }]}>Synced</Text>
      </View>
    </View>
  );
};

// Preview: transaction list
const TrackPreview = ({ hueA, hueB, text, sub }: { hueA: string; hueB: string; text: string; sub: string }) => {
  const rows = [
    { icon: '🍔', label: 'Food', when: 'Today', amount: '-$24', tone: hueA },
    { icon: '🚕', label: 'Transit', when: 'Yesterday', amount: '-$8', tone: hueB },
    { icon: '🎬', label: 'Cinema', when: 'Mon', amount: '-$15', tone: hueA },
  ];
  return (
    <View style={{ width: '100%' }}>
      <View style={styles.previewHeader}>
        <Text style={[styles.previewTitle, { color: text }]}>This week</Text>
        <Text style={[styles.previewSub, { color: sub }]}>−$47.00</Text>
      </View>
      {rows.map((r, idx) => (
        <View key={idx} style={styles.row}>
          <View style={[styles.rowIcon, { backgroundColor: r.tone + '22' }]}>
            <Text style={{ fontSize: 18 }}>{r.icon}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.rowLabel, { color: text }]}>{r.label}</Text>
            <Text style={[styles.rowMeta, { color: sub }]}>{r.when}</Text>
          </View>
          <Text style={[styles.rowAmt, { color: text }]}>{r.amount}</Text>
        </View>
      ))}
    </View>
  );
};

// Preview: debtor card
const DebtorPreview = ({ hueA, hueB, text, sub }: { hueA: string; hueB: string; text: string; sub: string }) => (
  <View style={{ width: '100%' }}>
    <View style={styles.previewHeader}>
      <Text style={[styles.previewTitle, { color: text }]}>Owes you</Text>
      <Text style={[styles.previewSub, { color: sub }]}>3 active</Text>
    </View>
    <View style={[styles.debtorBlock, { borderColor: hueA + '40' }]}>
      <View style={[styles.avatarCircle, { backgroundColor: hueA }]}>
        <Text style={styles.avatarText}>AK</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.rowLabel, { color: text }]}>Aziz K.</Text>
        <Text style={[styles.rowMeta, { color: sub }]}>Due Apr 30</Text>
      </View>
      <View style={[styles.amountPill, { backgroundColor: hueA + '22' }]}>
        <Text style={[styles.amountPillText, { color: hueA }]}>$120</Text>
      </View>
    </View>
    <View style={[styles.debtorBlock, { borderColor: hueB + '40' }]}>
      <View style={[styles.avatarCircle, { backgroundColor: hueB }]}>
        <Text style={styles.avatarText}>MR</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.rowLabel, { color: text }]}>Madina R.</Text>
        <Text style={[styles.rowMeta, { color: sub }]}>Due May 12</Text>
      </View>
      <View style={[styles.amountPill, { backgroundColor: hueB + '22' }]}>
        <Text style={[styles.amountPillText, { color: hueB }]}>$45</Text>
      </View>
    </View>
  </View>
);

// Preview: savings + sparkline
const SavingsPreview = ({ hueA, hueB, text, sub }: { hueA: string; hueB: string; text: string; sub: string }) => {
  const points = [40, 35, 48, 44, 60, 58, 72, 68, 84, 90];
  const w = 240;
  const h = 70;
  const max = Math.max(...points);
  const min = Math.min(...points);
  const range = max - min || 1;
  const path = points
    .map((p, idx) => {
      const x = (idx / (points.length - 1)) * w;
      const y = h - ((p - min) / range) * h;
      return `${idx === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(' ');

  return (
    <View style={{ width: '100%' }}>
      <Text style={[styles.previewSub, { color: sub }]}>Total saved</Text>
      <Text style={[styles.bigAmount, { color: text }]}>$2,840</Text>
      <View style={styles.gainPill}>
        <Svg width={10} height={10} viewBox="0 0 10 10">
          <Path d="M5 1 L9 7 L1 7 Z" fill={hueA} />
        </Svg>
        <Text style={[styles.gainText, { color: hueA }]}>+12.4% this month</Text>
      </View>
      <Svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ marginTop: 14 }}>
        <Defs>
          <SvgLinearGradient id="spark" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor={hueA} />
            <Stop offset="1" stopColor={hueB} />
          </SvgLinearGradient>
          <SvgLinearGradient id="sparkFill" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={hueA} stopOpacity={0.35} />
            <Stop offset="1" stopColor={hueA} stopOpacity={0} />
          </SvgLinearGradient>
        </Defs>
        <Path d={`${path} L${w} ${h} L0 ${h} Z`} fill="url(#sparkFill)" />
        <Path d={path} stroke="url(#spark)" strokeWidth={3} fill="none" strokeLinecap="round" />
      </Svg>
    </View>
  );
};

// ─── Gradient title word ───────────────────────────────────────────────────

const GradientWord = ({ text, hueA }: { text: string; hueA: string; hueB: string }) => {
  // Simple, reliable approach: use the first hue as the colored text.
  // (SVG text masking is fragile across RN versions; solid color stays crisp.)
  return <Text style={{ color: hueA, fontWeight: '800' }}>{text}</Text>;
};

// ─── Pagination dot ────────────────────────────────────────────────────────

const Dot = ({ active, hue, t }: { active: boolean; hue: string; t: Tokens }) => {
  const w = useRef(new Animated.Value(active ? 26 : 8)).current;
  useEffect(() => {
    Animated.spring(w, {
      toValue: active ? 26 : 8,
      damping: 14,
      stiffness: 160,
      useNativeDriver: false,
    }).start();
  }, [active, w]);
  return (
    <Animated.View
      style={{
        width: w,
        height: 8,
        borderRadius: 4,
        backgroundColor: active ? hue : t.borderStrong,
      }}
    />
  );
};

// ─── Styles ────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 18,
    paddingBottom: 28,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 32,
    zIndex: 2,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 7,
    alignItems: 'center',
  },
  skipBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  skipText: {
    fontSize: 15,
    fontWeight: '500',
  },
  heroWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  heroBox: {
    width: SCREEN_W - 56,
    maxWidth: 360,
  },
  glassCard: {
    borderWidth: 1,
    borderRadius: 28,
    paddingVertical: 22,
    paddingHorizontal: 22,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 16 },
    elevation: 8,
  },
  chip: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  chipDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  chipText: {
    fontSize: 11.5,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  textBlock: {
    marginTop: 24,
    marginBottom: 22,
    zIndex: 2,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -0.8,
    lineHeight: 38,
  },
  subtitle: {
    marginTop: 12,
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '500',
  },
  cta: {
    height: 56,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.22,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6,
    zIndex: 2,
  },
  ctaText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  orb: {
    position: 'absolute',
  },

  previewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  previewTitle: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  previewSub: {
    fontSize: 13,
    fontWeight: '600',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
  },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  rowMeta: {
    fontSize: 11.5,
    marginTop: 1,
  },
  rowAmt: {
    fontSize: 14,
    fontWeight: '700',
  },
  debtorBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
    marginVertical: 5,
  },
  avatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
    letterSpacing: 0.3,
  },
  amountPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  amountPillText: {
    fontSize: 13,
    fontWeight: '700',
  },
  bigAmount: {
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -1,
    marginTop: 4,
  },
  gainPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 6,
  },
  gainText: {
    fontSize: 12.5,
    fontWeight: '700',
  },
});
