import { useEffect, useState } from 'react';
import { Button, Field, Input } from '@/components/ui';
import { actions, useStore } from '@/lib/store';
import { tStr } from '@/lib/i18n';
import { toast } from '@/lib/toast';
import { extractError, SheetContainer, type SheetProps } from '../shared/SheetContainer';

export const EditNameSheet = ({ t, visible, onClose }: SheetProps) => {
  const s = useStore();
  const lang = s.prefs.lang;
  const [name, setName] = useState<string>(s.profile.name);
  const [busy, setBusy] = useState<boolean>(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      setName(s.profile.name);
      setErr(null);
      setBusy(false);
    }
  }, [visible, s.profile.name]);

  const submit = async () => {
    setErr(null);
    setBusy(true);
    try {
      await actions.updateName(name);
      toast(tStr(lang, 'saved'));
      onClose();
    } catch (e) {
      setErr(extractError(e, lang));
    } finally {
      setBusy(false);
    }
  };

  return (
    <SheetContainer
      t={t}
      visible={visible}
      onClose={onClose}
      title={tStr(lang, 'editName')}
      footer={<Button t={t} label={tStr(lang, 'save')} onPress={submit} loading={busy} />}
    >
      <Field t={t} label={tStr(lang, 'name')} error={err}>
        <Input
          t={t}
          value={name}
          onChangeText={setName}
          autoFocus
          placeholder="Your name"
          maxLength={80}
        />
      </Field>
    </SheetContainer>
  );
};
