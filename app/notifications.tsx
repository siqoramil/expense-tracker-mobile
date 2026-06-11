import { Stack } from 'expo-router';
import { Pressable, Text } from 'react-native';
import { NotificationsScreen } from '../components/screens/NotificationsScreen';
import { tStr } from '../lib/i18n';
import { actions, useStore } from '../lib/store';
import { makeTokens } from '../lib/tokens';

export default function NotificationsRoute() {
  const s = useStore();
  const t = makeTokens(s.prefs.dark);
  const lang = s.prefs.lang;

  return (
    <>
      <Stack.Screen
        options={{
          title: tStr(lang, 'notifications'),
          headerRight: () =>
            s.notifs.length > 0 ? (
              <Pressable onPress={() => actions.markAllNotifsRead()}>
                <Text style={{ color: t.accent, fontSize: 13, fontWeight: '600' }}>
                  {tStr(lang, 'markAllRead')}
                </Text>
              </Pressable>
            ) : null,
        }}
      />
      <NotificationsScreen t={t} />
    </>
  );
}
