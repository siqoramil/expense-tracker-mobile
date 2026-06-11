import { Stack, router, useLocalSearchParams } from 'expo-router';
import { Pressable } from 'react-native';
import { DebtorDetail } from '../../components/screens/DebtorDetail';
import { Icon } from '../../components/Icon';
import { useStore } from '../../lib/store';
import { makeTokens } from '../../lib/tokens';

export default function DebtorDetailRoute() {
  const s = useStore();
  const t = makeTokens(s.prefs.dark);
  const { id } = useLocalSearchParams<{ id: string }>();
  const debtor = s.debts.find((d) => d.id === id);
  if (!debtor) return null;
  return (
    <>
      <Stack.Screen
        options={{
          title: debtor.name,
          headerRight: () => (
            <Pressable
              onPress={() => router.push(`/add?debtId=${id}`)}
              hitSlop={12}
              style={{ paddingHorizontal: 16 }}
            >
              <Icon name="pen" size={20} color={t.text} />
            </Pressable>
          ),
        }}
      />
      <DebtorDetail t={t} debtor={debtor} />
    </>
  );
}
