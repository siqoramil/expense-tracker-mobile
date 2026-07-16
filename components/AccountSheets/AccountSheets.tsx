import React, { useEffect, useState } from 'react';
import { Dimensions, Pressable, ScrollView, Text, View } from 'react-native';
import { KeyboardStickyView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { Tokens } from '@/lib/tokens';
import { Icon } from '@/components/Icon';
import { ModalBackdrop } from '@/components/Glass';
import { Button, CodeInput, Field, Input } from '@/components/ui';
import { actions, useStore } from '@/lib/store';
import { errorMessage } from '@/lib/errors';
import { isGoogleAuthAvailable, signInWithGoogle } from '@/lib/googleAuth';
import { tStr, type Lang } from '@/lib/i18n';
import { toast } from '@/lib/toast';

type SheetProps = { t: Tokens; visible: boolean; onClose: () => void };

const SheetContainer = ({
  t,
  visible,
  onClose,
  title,
  children,
  footer,
}: React.PropsWithChildren<{
  t: Tokens;
  visible: boolean;
  onClose: () => void;
  title: string;
  footer?: React.ReactNode;
}>) => {
  const insets = useSafeAreaInsets();
  const sheetPaddingBottom = Math.max(insets.bottom, 16);
  // Numeric cap, not '90%': the sheet is wrapped in KeyboardStickyView (auto height),
  // so a percentage maxHeight has no basis to resolve against and collapses the
  // content. A concrete value lets short forms size to content and tall ones scroll.
  const maxSheetHeight = Dimensions.get('window').height * 0.9;
  return (
    <ModalBackdrop visible={visible} onClose={onClose}>
      {/* The whole sheet rides the keyboard as one compact unit, so the CTA
          stays directly under the content instead of leaving a big gap. */}
      <KeyboardStickyView offset={{ closed: 0, opened: sheetPaddingBottom }}>
        <Pressable
          onPress={() => {}}
          style={{
            backgroundColor: t.sheetBg,
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            paddingHorizontal: 22,
            paddingTop: 12,
            paddingBottom: sheetPaddingBottom,
            maxHeight: maxSheetHeight,
          }}
        >
          <View
            style={{
              width: 40,
              height: 4,
              borderRadius: 2,
              backgroundColor: t.borderStrong,
              alignSelf: 'center',
              marginBottom: 14,
            }}
          />
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 18,
            }}
          >
            <Text style={{ fontSize: 20, fontWeight: '700', color: t.text, letterSpacing: -0.4 }}>
              {title}
            </Text>
            <Pressable
              onPress={onClose}
              style={{
                width: 34,
                height: 34,
                borderRadius: 17,
                backgroundColor: t.surfaceAlt,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Icon name="close" size={16} color={t.textSec} stroke={2.2} />
            </Pressable>
          </View>
          {/* flexShrink lets the content scroll only if it would overflow the
              sheet's maxHeight; otherwise the sheet hugs its content. */}
          {/* footer lives INSIDE the ScrollView so its CTA is a child of the
              keyboardShouldPersistTaps="handled" tree — tapping Save while the
              keyboard is open fires on the first tap (it neither dismisses the
              keyboard nor lets the sticky view shift the button out from under
              the finger). */}
          <ScrollView
            bounces={false}
            keyboardShouldPersistTaps="always"
            showsVerticalScrollIndicator={false}
            style={{ flexGrow: 0, flexShrink: 1 }}
          >
            {children}
            {footer ? <View style={{ marginTop: 20 }}>{footer}</View> : null}
          </ScrollView>
        </Pressable>
      </KeyboardStickyView>
    </ModalBackdrop>
  );
};

const extractError = (e: unknown, lang: Lang): string => errorMessage(lang, e);

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
