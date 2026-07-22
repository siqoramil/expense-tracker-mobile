import { useEffect, useState } from 'react';
import { Text } from 'react-native';
import { Button, CodeInput, Field, Input } from '@/components/ui';
import { actions, useStore } from '@/lib/store';
import { isGoogleAuthAvailable, signInWithGoogle } from '@/lib/googleAuth';
import { tStr } from '@/lib/i18n';
import { toast } from '@/lib/toast';
import { extractError, SheetContainer, type SheetProps } from '../shared/SheetContainer';

export const DeleteAccountSheet = ({
  t,
  visible,
  onClose,
  onDeleted,
}: SheetProps & { onDeleted: () => void }) => {
  const s = useStore();
  const lang = s.prefs.lang;
  const email = s.profile.email;
  // Server 1.1.0 reports which credentials are configured. Treat a missing
  // hasPassword flag (older servers / unhydrated state) as "password account"
  // so we don't accidentally require Google re-auth where it isn't possible.
  const isGoogleOnly = s.profile.hasGoogle && !s.profile.hasPassword;
  const [step, setStep] = useState<1 | 2>(1);
  const [code, setCode] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [busy, setBusy] = useState<boolean>(false);
  const [err, setErr] = useState<string | null>(null);

  // Native Google re-auth is only offered for Google-only accounts.
  const googleEnabled = isGoogleOnly && isGoogleAuthAvailable();

  useEffect(() => {
    if (visible) {
      setStep(1);
      setCode('');
      setPassword('');
      setBusy(false);
      setErr(null);
    }
  }, [visible]);

  const finishConfirm = async (reauth: { password?: string; idToken?: string }) => {
    try {
      await actions.confirmAccountDelete(code, reauth);
      toast(tStr(lang, 'deleted'));
      onClose();
      onDeleted();
    } catch (e) {
      setErr(extractError(e, lang));
    } finally {
      setBusy(false);
    }
  };

  const requestCode = async () => {
    setErr(null);
    setBusy(true);
    try {
      await actions.requestAccountDelete();
      toast(tStr(lang, 'codeSentToast'));
      setStep(2);
    } catch (e) {
      setErr(extractError(e, lang));
    } finally {
      setBusy(false);
    }
  };

  const confirm = async () => {
    setErr(null);
    if (code.length !== 6) {
      setErr(tStr(lang, 'val_code_required'));
      return;
    }
    if (isGoogleOnly) {
      if (!googleEnabled) {
        setErr(tStr(lang, 'googleNotConfigured'));
        return;
      }
      setBusy(true);
      const res = await signInWithGoogle();
      if (res.type === 'cancel') {
        setBusy(false);
        return;
      }
      if (res.type === 'error') {
        setErr(`Google: ${res.message}`);
        setBusy(false);
        return;
      }
      void finishConfirm({ idToken: res.idToken });
      return;
    }
    if (!password) {
      setErr(tStr(lang, 'enterPassword'));
      return;
    }
    setBusy(true);
    await finishConfirm({ password });
  };

  const deleteFooter =
    step === 1 ? (
      <Button
        t={t}
        variant="danger"
        label={tStr(lang, 'sendCode')}
        onPress={requestCode}
        loading={busy}
      />
    ) : (
      <Button
        t={t}
        variant="danger"
        label={tStr(lang, 'deleteAccount')}
        onPress={confirm}
        loading={busy}
      />
    );

  return (
    <SheetContainer
      t={t}
      visible={visible}
      onClose={onClose}
      title={tStr(lang, 'deleteAccount')}
      footer={deleteFooter}
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
            {tStr(lang, 'deleteAccountWarning')}
          </Text>
          <Text
            style={{
              fontSize: 13,
              color: t.textSec,
              marginBottom: 14,
              lineHeight: 19,
            }}
          >
            {tStr(lang, 'deleteCodeHint', { email })}
          </Text>
          {err ? (
            <Text style={{ color: t.expense, fontSize: 13, marginTop: 10, fontWeight: '500' }}>
              {err}
            </Text>
          ) : null}
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
            {tStr(lang, 'deleteConfirmHint', { email })}
          </Text>
          <Field t={t} label={tStr(lang, 'verificationCode')}>
            <CodeInput t={t} value={code} onChangeText={setCode} error={!!err} autoFocus />
          </Field>
          {isGoogleOnly ? (
            <Text style={{ fontSize: 12, color: t.textSec, marginTop: 10, lineHeight: 17 }}>
              {tStr(lang, 'googleReauthHint')}
            </Text>
          ) : (
            <Field t={t} label={tStr(lang, 'currentPassword')} style={{ marginTop: 14 }}>
              <Input
                t={t}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                placeholder="••••••••"
                maxLength={128}
              />
            </Field>
          )}
          {err ? (
            <Text style={{ color: t.expense, fontSize: 13, marginTop: 10, fontWeight: '500' }}>
              {err}
            </Text>
          ) : null}
        </>
      )}
    </SheetContainer>
  );
};
