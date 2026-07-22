import { useEffect, useRef, useState } from 'react';
import {
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { Tokens } from '@/lib/tokens';

export const parseTime = (hhmm: string): { h: number; m: number } => {
  const [hStr, mStr] = (hhmm || '12:00').split(':');
  const h = Math.max(0, Math.min(23, Number(hStr) || 0));
  const m = Math.max(0, Math.min(59, Number(mStr) || 0));
  return { h, m };
};
export const formatTime = (h: number, m: number) =>
  `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;

const WHEEL_ITEM_H = 40;
const WHEEL_VISIBLE = 3; // odd number → one centered row
const WHEEL_H = WHEEL_ITEM_H * WHEEL_VISIBLE;
const WHEEL_PAD = WHEEL_ITEM_H * Math.floor(WHEEL_VISIBLE / 2);

// Scrollable wheel column (drag to spin; snaps to the centered value).
const WheelColumn = ({
  t,
  values,
  value,
  onChange,
}: {
  t: Tokens;
  values: number[];
  value: number;
  onChange: (v: number) => void;
}) => {
  const ref = useRef<ScrollView>(null);
  const didInit = useRef(false);
  const idx = Math.max(0, values.indexOf(value));
  const [centerIdx, setCenterIdx] = useState(idx);

  const scrollToIdx = (i: number, animated: boolean) =>
    ref.current?.scrollTo({ y: i * WHEEL_ITEM_H, animated });

  // Keep the wheel in sync when the value is changed from outside (e.g. "Now").
  useEffect(() => {
    if (!didInit.current) return;
    const i = values.indexOf(value);
    if (i >= 0 && i !== centerIdx) {
      setCenterIdx(i);
      scrollToIdx(i, false);
    }
  }, [value]); // eslint-disable-line react-hooks/exhaustive-deps

  const clampIdx = (y: number) =>
    Math.max(0, Math.min(values.length - 1, Math.round(y / WHEEL_ITEM_H)));

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const i = clampIdx(e.nativeEvent.contentOffset.y);
    if (i !== centerIdx) setCenterIdx(i);
  };

  const commit = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const i = clampIdx(e.nativeEvent.contentOffset.y);
    setCenterIdx(i);
    if (values[i] !== value) onChange(values[i]);
  };

  return (
    <View style={{ height: WHEEL_H, flex: 1, overflow: 'hidden' }}>
      {/* Center highlight band */}
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: WHEEL_PAD,
          left: 6,
          right: 6,
          height: WHEEL_ITEM_H,
          borderRadius: 12,
          backgroundColor: t.surfaceAlt,
        }}
      />
      <ScrollView
        ref={ref}
        showsVerticalScrollIndicator={false}
        snapToInterval={WHEEL_ITEM_H}
        decelerationRate="fast"
        scrollEventThrottle={16}
        onScroll={onScroll}
        onMomentumScrollEnd={commit}
        onScrollEndDrag={commit}
        onContentSizeChange={() => {
          if (!didInit.current) {
            didInit.current = true;
            scrollToIdx(idx, false);
          }
        }}
        contentContainerStyle={{ paddingVertical: WHEEL_PAD }}
      >
        {values.map((v, i) => {
          const on = i === centerIdx;
          return (
            <View
              key={v}
              style={{ height: WHEEL_ITEM_H, alignItems: 'center', justifyContent: 'center' }}
            >
              <Text
                style={{
                  fontSize: on ? 24 : 19,
                  fontWeight: on ? '700' : '500',
                  color: on ? t.accent : t.textTer,
                  letterSpacing: -0.3,
                }}
              >
                {String(v).padStart(2, '0')}
              </Text>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
};

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const MINUTES = Array.from({ length: 60 }, (_, i) => i);

export const TimePicker = ({
  t,
  value,
  onChange,
}: {
  t: Tokens;
  value: string;
  onChange: (hhmm: string) => void;
}) => {
  const { h, m } = parseTime(value);

  return (
    <View
      style={{
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: t.divider,
      }}
    >
      <View style={{ flexDirection: 'row', marginBottom: 4 }}>
        <Text
          style={{
            flex: 1,
            textAlign: 'center',
            fontSize: 11,
            color: t.textTer,
            fontWeight: '600',
            letterSpacing: 0.3,
          }}
        >
          HOUR
        </Text>
        <View style={{ width: 20 }} />
        <Text
          style={{
            flex: 1,
            textAlign: 'center',
            fontSize: 11,
            color: t.textTer,
            fontWeight: '600',
            letterSpacing: 0.3,
          }}
        >
          MINUTE
        </Text>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <WheelColumn t={t} values={HOURS} value={h} onChange={(v) => onChange(formatTime(v, m))} />
        <Text
          style={{ width: 20, textAlign: 'center', fontSize: 22, fontWeight: '700', color: t.textTer }}
        >
          :
        </Text>
        <WheelColumn t={t} values={MINUTES} value={m} onChange={(v) => onChange(formatTime(h, v))} />
      </View>
    </View>
  );
};
