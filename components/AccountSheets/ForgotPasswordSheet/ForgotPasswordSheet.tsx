import { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import type { Tokens } from '@/lib/tokens';
import { Button, CodeInput, Field, Input } from '@/components/ui';
import { actions, useStore } from '@/lib/store';
import { tStr } from '@/lib/i18n';
import { toast } from '@/lib/toast';
import { extractError, SheetContainer, type SheetProps } from '../shared/SheetContainer';

const StepIndicator = ({ t, step }: { t: Tokens; step: 1 | 2 | 3 }) => (
  <View style={{ flexDirection: 'row', gap: 6, marginBottom: 18 }}>
    {[1, 2, 3].map((n) => (
      <View
        key={n}
        style={{
          flex: 1,
          height: 4,
          borderRadius: 2,
          backgroundColor: n <= step ? t.accent : t.surfaceAlt,
        }}
      />
    ))}
  </View>
);

export const ForgotPasswordSheet = ({ t, visible, onClose }: SheetProps) => {
  const s = useStore();
  const lang = s.prefs.lang;
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [email, setEmail] = useState<string>('');
  const [code, setCode] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [verifiedToken, setVerifiedToken] = useState<string>('');
  const [busy, setBusy] = useState<boolean>(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      setStep(1);
      setEmail('');
      setCode('');
      setNewPassword('');
      setConfirmPassword('');
      setVerifiedToken('');
      setBusy(false);
      setErr(null);
    }
  }, [visible]);

  useEffect(() => setErr(null), [step]);

  const sendCode = async () => {
    setErr(null);
    const trimmed = email.trim();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setErr(tStr(lang, 'val_email_invalid_short'));
      return;
    }
    setBusy(true);
    try {
      await actions.forgotPassword(trimmed);
      toast(tStr(lang, 'codeSentToast'));
      setStep(2);
    } catch (e) {
      setErr(extractError(e, lang));
    } finally {
      setBusy(false);
    }
  };

  const verifyCode = async () => {
    setErr(null);
    if (code.length !== 6) {
      setErr(tStr(lang, 'val_code_required'));
      return;
    }
    setBusy(true);
    try {
      const token = await actions.verifyResetCode(email, code);
      setVerifiedToken(token);
      setStep(3);
    } catch (e) {
      setErr(extractError(e, lang));
    } finally {
      setBusy(false);
    }
  };

  const reset = async () => {
    setErr(null);
    if (!/^(?=.*[A-Za-z])(?=.*\d).{8,128}$/.test(newPassword)) {
      setErr(tStr(lang, 'val_password_weak'));
      return;
    }
    if (newPassword !== confirmPassword) {
      setErr(tStr(lang, 'val_passwords_mismatch'));
      return;
    }
    setBusy(true);
    try {
      await actions.resetPassword(email, code, newPassword, verifiedToken);
      toast(tStr(lang, 'passwordReset'));
      onClose();
    } catch (e) {
      setErr(extractError(e, lang));
    } finally {
      setBusy(false);
    }
  };

  const stepTitle =
    step === 1
      ? tStr(lang, 'resetPassword')
      : step === 2
        ? tStr(lang, 'verifyCode')
        : tStr(lang, 'newPassword');

  const forgotFooter =
    step === 1 ? (
      <Button t={t} label={tStr(lang, 'sendCode')} onPress={sendCode} loading={busy} />
    ) : step === 2 ? (
      <View>
        <Button t={t} label={tStr(lang, 'verify')} onPress={verifyCode} loading={busy} />
        <Pressable
          onPress={() => !busy && setStep(1)}
          style={{ alignItems: 'center', marginTop: 12 }}
        >
          <Text style={{ color: t.accent, fontSize: 14, fontWeight: '600' }}>
            {tStr(lang, 'useDifferentEmail')}
          </Text>
        </Pressable>
      </View>
    ) : (
      <Button t={t} label={tStr(lang, 'savePassword')} onPress={reset} loading={busy} />
    );

  return (
    <SheetContainer
      t={t}
      visible={visible}
      onClose={onClose}
      title={stepTitle}
      footer={forgotFooter}
    >
      <StepIndicator t={t} step={step} />

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
            {tStr(lang, 'resetPasswordHint')}
          </Text>
          <Field t={t} label={tStr(lang, 'email')} error={err}>
            <Input
              t={t}
              value={email}
              onChangeText={setEmail}
              autoFocus
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              placeholder="you@example.com"
              maxLength={200}
            />
          </Field>
        </>
      ) : step === 2 ? (
        <>
          <Text
            style={{
              fontSize: 13,
              color: t.textSec,
              marginBottom: 14,
              lineHeight: 19,
            }}
          >
            {tStr(lang, 'codeEmailHint', { email })}
          </Text>
          <Field t={t} label={tStr(lang, 'verificationCode')} error={err}>
            <CodeInput t={t} value={code} onChangeText={setCode} error={!!err} autoFocus />
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
            {tStr(lang, 'newPasswordHint')}
          </Text>
          <Field t={t} label={tStr(lang, 'newPassword')}>
            <Input
              t={t}
              value={newPassword}
              onChangeText={setNewPassword}
              autoFocus
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              placeholder="••••••••"
              maxLength={128}
            />
          </Field>
          <Field t={t} label={tStr(lang, 'confirmPassword')} error={err} style={{ marginTop: 14 }}>
            <Input
              t={t}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              placeholder="••••••••"
              maxLength={128}
            />
          </Field>
        </>
      )}
    </SheetContainer>
  );
};
