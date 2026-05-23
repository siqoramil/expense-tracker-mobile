import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { CURRENCY_LIST } from '../../lib/format';
import { LANGUAGES, tStr } from '../../lib/i18n';
import { actions, useStore } from '../../lib/store';
import type { Tokens } from '../../lib/tokens';
import { Icon } from '../Icon';
import { Card, ScreenHeader } from '../ui';

export const LanguageScreen: React.FC<{ t: Tokens; onBack: () => void }> = ({ t, onBack }) => {
  const s = useStore();
  const lang = s.prefs.lang;
  return (
    <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
      <ScreenHeader t={t} title={tStr(lang, 'language')} onBack={onBack} />
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

export const CurrencyScreen: React.FC<{ t: Tokens; onBack: () => void }> = ({ t, onBack }) => {
  const s = useStore();
  const lang = s.prefs.lang;
  return (
    <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
      <ScreenHeader t={t} title={tStr(lang, 'currency')} onBack={onBack} />
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

// The previous version of this screen exposed "App PIN lock" and
// "Biometric unlock" toggles, but flipping them only mutated a pref flag —
// nothing in the app actually checked them at launch. That conveyed a
// false sense of security, so the toggles are hidden until the underlying
// lock screen + expo-local-authentication wiring lands.
export const SecurityScreen: React.FC<{ t: Tokens; onBack: () => void }> = ({ t, onBack }) => {
  const s = useStore();
  const lang = s.prefs.lang;
  const heading =
    lang === 'uz'
      ? 'Qulflar tez orada'
      : lang === 'ru'
        ? 'Блокировки скоро'
        : 'App locks coming soon';
  const body =
    lang === 'uz'
      ? 'PIN va biometrik qulf hozircha mavjud emas. Hisobingizni himoya qilish uchun kuchli parol ishlating va telefoningizning ekran qulfini yoqing.'
      : lang === 'ru'
        ? 'PIN и биометрическая блокировка пока недоступны. Используйте надёжный пароль и блокировку экрана устройства.'
        : 'PIN and biometric locks are not available yet. Use a strong password and your phone’s screen lock to protect your account.';
  return (
    <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
      <ScreenHeader t={t} title={tStr(lang, 'security')} onBack={onBack} />
      <View style={{ paddingHorizontal: 20 }}>
        <Card t={t} style={{ paddingHorizontal: 18, paddingVertical: 22 }}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 14 }}>
            <View
              style={{
                width: 38,
                height: 38,
                borderRadius: 19,
                backgroundColor: t.surfaceAlt,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Icon name="lock" size={18} color={t.textSec} stroke={2} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 15, fontWeight: '700', color: t.text, marginBottom: 6 }}>
                {heading}
              </Text>
              <Text style={{ fontSize: 13, color: t.textSec, lineHeight: 19 }}>{body}</Text>
            </View>
          </View>
        </Card>
      </View>
    </ScrollView>
  );
};
