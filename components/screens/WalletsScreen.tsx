import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { fmtMoney, unitOf } from '../../lib/format';
import { tStr } from '../../lib/i18n';
import { useStore, walletName } from '../../lib/store';
import type { Tokens } from '../../lib/tokens';
import { Icon, type IconName } from '../Icon';
import { Card, ScreenHeader } from '../ui';

export const WalletsScreen: React.FC<{ t: Tokens; onBack: () => void }> = ({ t, onBack }) => {
  const s = useStore();
  const lang = s.prefs.lang;
  const total = s.wallets.reduce((a, w) => a + w.balance, 0);
  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
      <ScreenHeader
        t={t}
        title={tStr(lang, 'wallets')}
        onBack={onBack}
        subtitle={`${fmtMoney(total, s.prefs.currency)} ${unitOf(s.prefs.currency)}`.trim()}
      />
      <View style={{ paddingHorizontal: 20, gap: 10 }}>
        {s.wallets.map((w) => (
          <Card
            key={w.id}
            t={t}
            style={{
              padding: 18,
              backgroundColor: w.color,
              borderColor: 'transparent',
              overflow: 'hidden',
            }}
          >
            <View
              style={{
                position: 'absolute',
                top: -20,
                right: -20,
                width: 100,
                height: 100,
                borderRadius: 50,
                backgroundColor: 'rgba(255,255,255,0.15)',
              }}
            />
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  backgroundColor: 'rgba(255,255,255,0.25)',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Icon name={w.icon as IconName} size={18} color="#fff" />
              </View>
              <Text style={{ fontSize: 14, fontWeight: '600', color: '#fff' }}>
                {walletName(w, lang)}
              </Text>
            </View>
            <Text style={{ fontSize: 24, fontWeight: '700', color: '#fff', letterSpacing: -0.8 }}>
              {fmtMoney(w.balance, s.prefs.currency)}
            </Text>
            <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 2 }}>
              {unitOf(s.prefs.currency) || s.prefs.currency}
            </Text>
          </Card>
        ))}
      </View>
    </ScrollView>
  );
};
