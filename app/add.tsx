import { router, useLocalSearchParams } from 'expo-router';
import { AddSheet, type AddMode } from '@/components/AddSheet';
import { makeTokens } from '@/lib/tokens';
import { useStore } from '@/lib/store';

export default function AddRoute() {
  const s = useStore();
  const t = makeTokens(s.prefs.dark);
  const { mode, editId, debtId } = useLocalSearchParams<{ mode?: AddMode; editId?: string; debtId?: string }>();
  const editTx = editId ? (s.tx.find((x) => x.id === editId) ?? null) : null;
  const editDebt = debtId ? (s.debts.find((d) => d.id === debtId) ?? null) : null;

  // Pushed screen: inherits the root <KeyboardProvider> from app/_layout.tsx,
  // so KeyboardAwareScrollView / KeyboardStickyView work without a local provider.
  return (
    <AddSheet t={t} mode={mode} editTx={editTx} editDebt={editDebt} onClose={() => router.back()} />
  );
}
