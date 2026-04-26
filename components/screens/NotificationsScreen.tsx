import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { fmtDate } from '../../lib/format';
import { tStr } from '../../lib/i18n';
import { actions, useStore, type NotifKind } from '../../lib/store';
import type { Tokens } from '../../lib/tokens';
import { Icon, type IconName } from '../Icon';
import { Card, EmptyState, ScreenHeader } from '../ui';

export const NotificationsScreen: React.FC<{ t: Tokens; onBack: () => void }> = ({ t, onBack }) => {
  const s = useStore();
  const lang = s.prefs.lang;
  const ICONS: Record<NotifKind, [IconName, string]> = {
    overdue: ['close', t.expense],
    budget: ['chart', '#F59E0B'],
    bill: ['calendar', t.accent],
    income: ['arrow-down-left', t.income],
  };

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
      <ScreenHeader
        t={t}
        title={tStr(lang, 'notifications')}
        onBack={onBack}
        trailing={
          s.notifs.length > 0 ? (
            <Pressable onPress={() => actions.markAllNotifsRead()}>
              <Text style={{ color: t.accent, fontSize: 13, fontWeight: '600' }}>
                {lang === 'uz' ? 'Hammasi o‘qildi' : 'Mark all read'}
              </Text>
            </Pressable>
          ) : null
        }
      />
      <View style={{ paddingHorizontal: 20, gap: 8 }}>
        {s.notifs.length === 0 ? (
          <Card t={t}>
            <EmptyState
              icon="bell"
              title={lang === 'uz' ? 'Bildirishnomalar yo‘q' : 'No notifications'}
              t={t}
            />
          </Card>
        ) : (
          s.notifs.map((n) => {
            const [icon, color] = ICONS[n.kind] || ['bell', t.accent];
            return (
              <Card
                key={n.id}
                t={t}
                onPress={() => actions.markNotifRead(n.id)}
                style={{
                  padding: 16,
                  flexDirection: 'row',
                  gap: 12,
                  backgroundColor: n.read ? t.surface : t.accentSoft,
                }}
              >
                <View
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 18,
                    backgroundColor: color + '22',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Icon name={icon} size={17} color={color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 14, fontWeight: '600', color: t.text }}>
                    {n.title[lang] || n.title.en}
                  </Text>
                  <Text style={{ fontSize: 12.5, color: t.textSec, marginTop: 3 }}>
                    {n.body[lang] || n.body.en}
                  </Text>
                  <Text style={{ fontSize: 11, color: t.textTer, marginTop: 4 }}>{fmtDate(n.date, lang)}</Text>
                </View>
                {!n.read ? (
                  <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: t.accent, marginTop: 6 }} />
                ) : null}
              </Card>
            );
          })
        )}
      </View>
    </ScrollView>
  );
};
