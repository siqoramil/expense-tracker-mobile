import { router, useLocalSearchParams } from 'expo-router';
import { AddSheet, type AddMode } from '../components/AddSheet';
import { useStore } from '../lib/store';
import { makeTokens } from '../lib/tokens';

export default function AddRoute() {
  const s = useStore();
  const t = makeTokens(s.prefs.dark);
  const { mode, editId, debtId } = useLocalSearchParams<{ mode?: AddMode; editId?: string; debtId?: string }>();
  const editTx = editId ? (s.tx.find((x) => x.id === editId) ?? null) : null;
  const editDebt = debtId ? (s.debts.find((d) => d.id === debtId) ?? null) : null;

  return <AddSheet t={t} mode={mode} editTx={editTx} editDebt={editDebt} onClose={() => router.back()} />;
}
