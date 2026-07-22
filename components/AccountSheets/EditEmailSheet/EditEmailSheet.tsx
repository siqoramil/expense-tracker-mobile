import { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Button, CodeInput, Field, Input } from '@/components/ui';
import { actions, useStore } from '@/lib/store';
import { tStr } from '@/lib/i18n';
import { toast } from '@/lib/toast';
import { extractError, SheetContainer, type SheetProps } from '../shared/SheetContainer';

export const EditEmailSheet = ({ t, visible, onClose }: SheetProps) => {
  const s = useStore();
  const lang = s.prefs.lang;
  const [step, setStep] = useState<1 | 2>(1);
  const [newEmail, setNewEmail] = useState<string>('');
  const [code, setCode] = useState<string>('');
  const [busy, setBusy] = useState<boolean>(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      setStep(1);
      setNewEmail('');
      setCode('');
      setBusy(false);
      setErr(null);
    }
  }, [visible]);

  const requestCode = async () => {
    setErr(null);
    setBusy(true);
    try {
      await actions.requestEmailChange(newEmail);
      toast(tStr(lang, 'codeSentToast'));
      setStep(2);
    } catch (e) {
      setErr(extractError(e, lang));
    } finally {
      setBusy(false);
    }
  };

  const verify = async () => {
    setErr(null);
    setBusy(true);
    try {
      await actions.verifyEmailChange(code);
      toast(tStr(lang, 'emailUpdated'));
      onClose();
    } catch (e) {
      setErr(extractError(e, lang));
    } finally {
      setBusy(false);
    }
  };

  const emailFooter =
    step === 1 ? (
      <Button t={t} label={tStr(lang, 'sendCode')} onPress={requestCode} loading={busy} />
    ) : (
      <View>
        <Button t={t} label={tStr(lang, 'verify')} onPress={verify} loading={busy} />
        <Pressable onPress={() => setStep(1)} style={{ alignItems: 'center', marginTop: 12 }}>
          <Text style={{ color: t.accent, fontSize: 14, fontWeight: '600' }}>
            {tStr(lang, 'useDifferentEmail')}
          </Text>
        </Pressable>
      </View>
    );

  return (
    <SheetContainer
      t={t}
      visible={visible}
      onClose={onClose}
      title={tStr(lang, 'editEmail')}
      footer={emailFooter}
    >
      {step === 1 ? (
        <>
          <Text
            style={{
              fontSize: 13,
              color: t.textSec,
              marginBottom: 14,
              lineHeight: 19,
            }}
          >
            {tStr(lang, 'emailCodeHint')}
          </Text>
          <Field t={t} label={tStr(lang, 'newEmail')} error={err}>
            <Input
              t={t}
              value={newEmail}
              onChangeText={setNewEmail}
              autoFocus
              autoCapitalize="none"
              keyboardType="email-address"
              placeholder="you@example.com"
              maxLength={200}
            />
          </Field>
        </>
      ) : (
        <>
          <Text
            style={{
              fontSize: 13,
              color: t.textSec,
              marginBottom: 14,
              lineHeight: 19,
            }}
          >
            {tStr(lang, 'codeEmailHint', { email: newEmail })}
          </Text>
          <Field t={t} label={tStr(lang, 'verificationCode')} error={err}>
            <CodeInput t={t} value={code} onChangeText={setCode} error={!!err} autoFocus />
          </Field>
        </>
      )}
    </SheetContainer>
  );
};
