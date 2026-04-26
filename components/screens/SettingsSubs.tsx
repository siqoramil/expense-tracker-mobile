import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { CURRENCY_LIST } from '../../lib/format';
import { LANGUAGES, tStr } from '../../lib/i18n';
import { actions, useStore } from '../../lib/store';
import type { Tokens } from '../../lib/tokens';
import { Icon } from '../Icon';
import { Card, ScreenHeader } from '../ui';
import { ToggleRow } from './ProfileScreen';

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

export const SecurityScreen: React.FC<{ t: Tokens; onBack: () => void }> = ({ t, onBack }) => {
  const s = useStore();
  const lang = s.prefs.lang;
  return (
    <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
      <ScreenHeader t={t} title={tStr(lang, 'security')} onBack={onBack} />
      <View style={{ paddingHorizontal: 20 }}>
        <Card t={t}>
          <ToggleRow
            t={t}
            icon="lock"
            color="#8B5CF6"
            label="App PIN lock"
            on={s.prefs.pin}
            onChange={(v) => actions.setPref('pin', v)}
          />
          <ToggleRow
            t={t}
            icon="user"
            color="#06B6D4"
            label="Biometric unlock"
            on={s.prefs.biometric}
            onChange={(v) => actions.setPref('biometric', v)}
            last
          />
        </Card>
      </View>
    </ScrollView>
  );
};
