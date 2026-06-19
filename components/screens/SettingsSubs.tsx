import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { Tokens } from '@/lib/tokens';
import { CURRENCY_LIST } from '@/lib/format';
import { Card } from '@/components/ui';
import { Icon } from '@/components/Icon';
import { ModalBackdrop } from '@/components/Glass';
import { LANGUAGES, tStr } from '@/lib/i18n';
import { actions, useStore } from '@/lib/store';

export const LanguageScreen: React.FC<{ t: Tokens }> = ({ t }) => {
  const s = useStore();
  const lang = s.prefs.lang;
  return (
    <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
      <View style={{ paddingHorizontal: 20 }}>
        <Card t={t} style={{ paddingHorizontal: 16 }}>
          {LANGUAGES.map((o, i) => (
            <Pressable
              key={o.code}
              onPress={() => actions.setPref('lang', o.code)}
              style={{
                paddingVertical: 14,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
                borderBottomWidth: i === LANGUAGES.length - 1 ? 0 : StyleSheet.hairlineWidth,
                borderBottomColor: t.divider,
              }}
            >
              <Text style={{ fontSize: 22 }}>{o.flag}</Text>
              <Text style={{ flex: 1, fontSize: 14.5, color: t.text, fontWeight: '500' }}>
                {o.native}
              </Text>
              {lang === o.code ? <Icon name="check" size={18} color={t.accent} stroke={3} /> : null}
            </Pressable>
          ))}
        </Card>
      </View>
    </ScrollView>
  );
};

export const LanguageSheet: React.FC<{ t: Tokens; visible: boolean; onClose: () => void }> = ({
  t,
  visible,
  onClose,
}) => {
  const s = useStore();
  const lang = s.prefs.lang;
  const insets = useSafeAreaInsets();
  return (
    <ModalBackdrop visible={visible} onClose={onClose}>
      <Pressable
        onPress={() => {}}
        style={{
          backgroundColor: t.sheetBg,
          borderTopLeftRadius: 28,
          borderTopRightRadius: 28,
          paddingHorizontal: 22,
          paddingTop: 12,
          paddingBottom: Math.max(insets.bottom, 16),
          maxHeight: '85%',
        }}
      >
        <View
          style={{
            width: 40,
            height: 4,
            borderRadius: 2,
            backgroundColor: t.borderStrong,
            alignSelf: 'center',
            marginBottom: 14,
          }}
        />
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 14,
          }}
        >
          <Text style={{ fontSize: 20, fontWeight: '700', color: t.text, letterSpacing: -0.4 }}>
            {tStr(lang, 'language')}
          </Text>
          <Pressable
            onPress={onClose}
            style={{
              width: 34,
              height: 34,
              borderRadius: 17,
              backgroundColor: t.surfaceAlt,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon name="close" size={16} color={t.textSec} stroke={2.2} />
          </Pressable>
        </View>
        <ScrollView bounces={false} showsVerticalScrollIndicator={false} style={{ flexGrow: 0, flexShrink: 1 }}>
          {LANGUAGES.map((o, i) => (
            <Pressable
              key={o.code}
              onPress={() => {
                actions.setPref('lang', o.code);
                onClose();
              }}
              style={{
                paddingVertical: 14,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
                borderBottomWidth: i === LANGUAGES.length - 1 ? 0 : StyleSheet.hairlineWidth,
                borderBottomColor: t.divider,
              }}
            >
              <Text style={{ fontSize: 22 }}>{o.flag}</Text>
              <Text style={{ flex: 1, fontSize: 14.5, color: t.text, fontWeight: '500' }}>
                {o.native}
              </Text>
              {lang === o.code ? (
                <Icon name="check" size={18} color={t.accent} stroke={3} />
              ) : null}
            </Pressable>
          ))}
        </ScrollView>
      </Pressable>
    </ModalBackdrop>
  );
};

export const CurrencySheet: React.FC<{ t: Tokens; visible: boolean; onClose: () => void }> = ({
  t,
  visible,
  onClose,
}) => {
  const s = useStore();
  const lang = s.prefs.lang;
  const insets = useSafeAreaInsets();
  return (
    <ModalBackdrop visible={visible} onClose={onClose}>
      <Pressable
        onPress={() => {}}
        style={{
          backgroundColor: t.sheetBg,
          borderTopLeftRadius: 28,
          borderTopRightRadius: 28,
          paddingHorizontal: 22,
          paddingTop: 12,
          paddingBottom: Math.max(insets.bottom, 16),
          maxHeight: '85%',
        }}
      >
        <View
          style={{
            width: 40,
            height: 4,
            borderRadius: 2,
            backgroundColor: t.borderStrong,
            alignSelf: 'center',
            marginBottom: 14,
          }}
        />
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 14,
          }}
        >
          <Text style={{ fontSize: 20, fontWeight: '700', color: t.text, letterSpacing: -0.4 }}>
            {tStr(lang, 'currency')}
          </Text>
          <Pressable
            onPress={onClose}
            style={{
              width: 34,
              height: 34,
              borderRadius: 17,
              backgroundColor: t.surfaceAlt,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon name="close" size={16} color={t.textSec} stroke={2.2} />
          </Pressable>
        </View>
        <ScrollView bounces={false} showsVerticalScrollIndicator={false} style={{ flexGrow: 0, flexShrink: 1 }}>
          {CURRENCY_LIST.map((c, i) => (
            <Pressable
              key={c.code}
              onPress={() => {
                actions.setPref('currency', c.code);
                onClose();
              }}
              style={{
                paddingVertical: 14,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
                borderBottomWidth: i === CURRENCY_LIST.length - 1 ? 0 : StyleSheet.hairlineWidth,
                borderBottomColor: t.divider,
              }}
            >
              <Text style={{ fontSize: 22 }}>{c.flag}</Text>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14.5, color: t.text, fontWeight: '600' }}>{c.code}</Text>
                <Text style={{ fontSize: 12, color: t.textSec, marginTop: 1 }}>
                  {c.symbol || c.suffix}
                </Text>
              </View>
              {s.prefs.currency === c.code ? (
                <Icon name="check" size={18} color={t.accent} stroke={3} />
              ) : null}
            </Pressable>
          ))}
        </ScrollView>
      </Pressable>
    </ModalBackdrop>
  );
};

export const CurrencyScreen: React.FC<{ t: Tokens }> = ({ t }) => {
  const s = useStore();
  return (
    <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
      <View style={{ paddingHorizontal: 20 }}>
        <Card t={t} style={{ paddingHorizontal: 16 }}>
          {CURRENCY_LIST.map((c, i) => (
            <Pressable
              key={c.code}
              onPress={() => actions.setPref('currency', c.code)}
              style={{
                paddingVertical: 14,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
                borderBottomWidth: i === CURRENCY_LIST.length - 1 ? 0 : StyleSheet.hairlineWidth,
                borderBottomColor: t.divider,
              }}
            >
              <Text style={{ fontSize: 22 }}>{c.flag}</Text>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14.5, color: t.text, fontWeight: '600' }}>{c.code}</Text>
                <Text style={{ fontSize: 12, color: t.textSec, marginTop: 1 }}>
                  {c.symbol || c.suffix}
                </Text>
              </View>
              {s.prefs.currency === c.code ? (
                <Icon name="check" size={18} color={t.accent} stroke={3} />
              ) : null}
            </Pressable>
          ))}
        </Card>
      </View>
    </ScrollView>
  );
};

