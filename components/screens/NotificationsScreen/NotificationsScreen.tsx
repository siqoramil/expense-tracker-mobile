import React from 'react';
import { FlatList, Text, View } from 'react-native';
import type { Tokens } from '@/lib/tokens';
import { Card, EmptyState } from '@/components/ui';
import { Icon, type IconName } from '@/components/Icon';
import { actions, type Notif, type NotifKind, useStore } from '@/lib/store';
import { fmtDate } from '@/lib/format';
import { tStr } from '@/lib/i18n';

export const NotificationsScreen = ({ t }: { t: Tokens }) => {
  const s = useStore();
  const lang = s.prefs.lang;
  const ICONS: Record<NotifKind, [IconName, string]> = {
    overdue: ['close', t.expense],
    budget: ['chart', '#F59E0B'],
    bill: ['calendar', t.accent],
    income: ['arrow-down-left', t.income],
  };

  return (
    <FlatList
      data={s.notifs}
      keyExtractor={(n) => n.id}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 120, gap: 8 }}
      ListEmptyComponent={
        <Card t={t}>
          <EmptyState
            icon="bell"
            title={tStr(lang, 'noNotifications')}
            t={t}
          />
        </Card>
      }
      renderItem={({ item: n }: { item: Notif }) => {
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
              <Text style={{ fontSize: 11, color: t.textTer, marginTop: 4 }}>
                {fmtDate(n.date, lang)}
              </Text>
            </View>
            {!n.read ? (
              <View
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: t.accent,
                  marginTop: 6,
                }}
              />
            ) : null}
          </Card>
        );
      }}
    />
  );
};
