import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { CURRENCY_LIST } from '../../lib/format';
import { LANGUAGES } from '../../lib/i18n';
import { actions, useStore } from '../../lib/store';
import type { Tokens } from '../../lib/tokens';
import { Icon } from '../Icon';
import { Card } from '../ui';

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

