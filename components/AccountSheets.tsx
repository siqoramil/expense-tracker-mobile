import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { KeyboardAwareScrollView, KeyboardProvider } from 'react-native-keyboard-controller';
import { AppTextInput } from './AppTextInput';
import { errorMessage } from '../lib/errors';
import { isGoogleAuthAvailable, signInWithGoogle } from '../lib/googleAuth';
import { tStr, type Lang } from '../lib/i18n';
import { actions, useStore } from '../lib/store';
import { toast } from '../lib/toast';
import type { Tokens } from '../lib/tokens';
import { ModalBackdrop } from './Glass';
import { Icon } from './Icon';

type SheetProps = { t: Tokens; visible: boolean; onClose: () => void };

const SheetContainer: React.FC<{
  t: Tokens;
  visible: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}> = ({ t, visible, onClose, title, children }) => (
  <Modal
    visible={visible}
    transparent
    animationType="slide"
    statusBarTranslucent
    onRequestClose={onClose}
  >
    <KeyboardProvider statusBarTranslucent navigationBarTranslucent>
      <ModalBackdrop>
        <Pressable onPress={onClose} style={{ flex: 1, justifyContent: 'flex-end' }}>
          <Pressable
            onPress={() => {}}
            style={{
              backgroundColor: t.sheetBg,
              borderTopLeftRadius: 28,
              borderTopRightRadius: 28,
              paddingHorizontal: 22,
              paddingTop: 12,
              paddingBottom: 34,
              maxHeight: '90%',
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
            <KeyboardAwareScrollView
              bottomOffset={24}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {children}
            </KeyboardAwareScrollView>
          </Pressable>
        </Pressable>
      </ModalBackdrop>
    </KeyboardProvider>
  </Modal>
);

const fieldLabel = (t: Tokens, label: string) => (
  <Text
    style={{
      fontSize: 11,
      fontWeight: '700',
      color: t.textSec,
      marginBottom: 7,
      letterSpacing: 0.6,
    }}
  >
    {label.toUpperCase()}
  </Text>
);

const inputStyle = (t: Tokens) => ({
  paddingVertical: 14,
  paddingHorizontal: 16,
  borderRadius: 14,
  backgroundColor: t.surfaceAlt,
  borderWidth: StyleSheet.hairlineWidth,
  borderColor: t.border,
  color: t.text,
  fontSize: 15,
});

const primaryBtn = (t: Tokens, label: string, onPress: () => void, busy = false) => (
  <Pressable
    onPress={busy ? undefined : onPress}
    style={{
      height: 52,
      borderRadius: 14,
      backgroundColor: t.accent,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 16,
      opacity: busy ? 0.7 : 1,
      shadowColor: t.accent,
      shadowOpacity: 0.3,
      shadowRadius: 14,
      shadowOffset: { width: 0, height: 4 },
      elevation: 4,
    }}
  >
    {busy ? (
      <ActivityIndicator color="#fff" />
    ) : (
      <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700', letterSpacing: 0.2 }}>
        {label}
      </Text>
    )}
  </Pressable>
);

const errorText = (t: Tokens, msg: string | null) =>
  msg ? (
    <Text style={{ color: t.expense, fontSize: 13, marginTop: 10, fontWeight: '500' }}>{msg}</Text>
  ) : null;

const extractError = (e: unknown, lang: Lang): string => errorMessage(lang, e);

export const EditNameSheet: React.FC<SheetProps> = ({ t, visible, onClose }) => {
  const s = useStore();
  const lang = s.prefs.lang;
  const [name, setName] = useState(s.profile.name);
  const [busy, setBusy] = useState(false);
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
    >
      {fieldLabel(t, tStr(lang, 'name'))}
      <AppTextInput
        value={name}
        onChangeText={setName}
        autoFocus
        placeholder="Your name"
        placeholderTextColor={t.textTer}
        maxLength={80}
        style={inputStyle(t)}
      />
      {errorText(t, err)}
      {primaryBtn(t, tStr(lang, 'save'), submit, busy)}
    </SheetContainer>
  );
};

export const EditEmailSheet: React.FC<SheetProps> = ({ t, visible, onClose }) => {
  const s = useStore();
  const lang = s.prefs.lang;
  const [step, setStep] = useState<1 | 2>(1);
  const [newEmail, setNewEmail] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
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

  return (
    <SheetContainer
      t={t}
      visible={visible}
      onClose={onClose}
      title={tStr(lang, 'editEmail')}
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
          {fieldLabel(t, tStr(lang, 'newEmail'))}
          <AppTextInput
            value={newEmail}
            onChangeText={setNewEmail}
            autoFocus
            autoCapitalize="none"
            keyboardType="email-address"
            placeholder="you@example.com"
            placeholderTextColor={t.textTer}
            maxLength={200}
            style={inputStyle(t)}
          />
          {errorText(t, err)}
          {primaryBtn(t, tStr(lang, 'sendCode'), requestCode, busy)}
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
          {fieldLabel(t, tStr(lang, 'verificationCode'))}
          <AppTextInput
            value={code}
            onChangeText={(v) => setCode(v.replace(/\D/g, '').slice(0, 6))}
            autoFocus
            keyboardType="number-pad"
            placeholder="000000"
            placeholderTextColor={t.textTer}
            maxLength={6}
            style={[
              inputStyle(t),
              { fontSize: 22, textAlign: 'center', letterSpacing: 8, fontWeight: '700' },
            ]}
          />
          {errorText(t, err)}
          {primaryBtn(t, tStr(lang, 'verify'), verify, busy)}
          <Pressable onPress={() => setStep(1)} style={{ alignItems: 'center', marginTop: 12 }}>
            <Text style={{ color: t.accent, fontSize: 14, fontWeight: '600' }}>
              {tStr(lang, 'useDifferentEmail')}
            </Text>
          </Pressable>
        </>
      )}
    </SheetContainer>
  );
};

export const ForgotPasswordSheet: React.FC<SheetProps> = ({ t, visible, onClose }) => {
  const s = useStore();
  const lang = s.prefs.lang;
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      setStep(1);
      setEmail('');
      setCode('');
      setNewPassword('');
      setConfirmPassword('');
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
      await actions.verifyResetCode(email, code);
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
      await actions.resetPassword(email, code, newPassword);
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

  return (
    <SheetContainer t={t} visible={visible} onClose={onClose} title={stepTitle}>
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
          {fieldLabel(t, tStr(lang, 'email'))}
          <AppTextInput
            value={email}
            onChangeText={setEmail}
            autoFocus
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            placeholder="you@example.com"
            placeholderTextColor={t.textTer}
            maxLength={200}
            style={inputStyle(t)}
          />
          {errorText(t, err)}
          {primaryBtn(t, tStr(lang, 'sendCode'), sendCode, busy)}
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
          {fieldLabel(t, tStr(lang, 'verificationCode'))}
          <AppTextInput
            value={code}
            onChangeText={(v) => setCode(v.replace(/\D/g, '').slice(0, 6))}
            autoFocus
            keyboardType="number-pad"
            placeholder="000000"
            placeholderTextColor={t.textTer}
            maxLength={6}
            style={[
              inputStyle(t),
              { fontSize: 22, textAlign: 'center', letterSpacing: 8, fontWeight: '700' },
            ]}
          />
          {errorText(t, err)}
          {primaryBtn(t, tStr(lang, 'verify'), verifyCode, busy)}
          <Pressable
            onPress={() => !busy && setStep(1)}
            style={{ alignItems: 'center', marginTop: 12 }}
          >
            <Text style={{ color: t.accent, fontSize: 14, fontWeight: '600' }}>
              {tStr(lang, 'useDifferentEmail')}
            </Text>
          </Pressable>
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
          {fieldLabel(t, tStr(lang, 'newPassword'))}
          <AppTextInput
            value={newPassword}
            onChangeText={setNewPassword}
            autoFocus
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            placeholder="••••••••"
            placeholderTextColor={t.textTer}
            maxLength={128}
            style={inputStyle(t)}
          />
          <View style={{ height: 14 }} />
          {fieldLabel(t, tStr(lang, 'confirmPassword'))}
          <AppTextInput
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            placeholder="••••••••"
            placeholderTextColor={t.textTer}
            maxLength={128}
            style={inputStyle(t)}
          />
          {errorText(t, err)}
          {primaryBtn(t, tStr(lang, 'savePassword'), reset, busy)}
        </>
      )}
    </SheetContainer>
  );
};

export const DeleteAccountSheet: React.FC<SheetProps & { onDeleted: () => void }> = ({
  t,
  visible,
  onClose,
  onDeleted,
}) => {
  const s = useStore();
  const lang = s.prefs.lang;
  const email = s.profile.email;
  // Server 1.1.0 reports which credentials are configured. Treat a missing
  // hasPassword flag (older servers / unhydrated state) as "password account"
  // so we don't accidentally require Google re-auth where it isn't possible.
  const isGoogleOnly = s.profile.hasGoogle && !s.profile.hasPassword;
  const [step, setStep] = useState<1 | 2>(1);
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
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

  const dangerBtn = (label: string, onPress: () => void, busyState: boolean) => (
    <Pressable
      onPress={busyState ? undefined : onPress}
      style={{
        height: 52,
        borderRadius: 14,
        backgroundColor: t.expense,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 16,
        opacity: busyState ? 0.7 : 1,
      }}
    >
      {busyState ? (
        <ActivityIndicator color="#fff" />
      ) : (
        <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700', letterSpacing: 0.2 }}>
          {label}
        </Text>
      )}
    </Pressable>
  );

  return (
    <SheetContainer t={t} visible={visible} onClose={onClose} title={tStr(lang, 'deleteAccount')}>
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
          {errorText(t, err)}
          {dangerBtn(tStr(lang, 'sendCode'), requestCode, busy)}
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
          {fieldLabel(t, tStr(lang, 'verificationCode'))}
          <AppTextInput
            value={code}
            onChangeText={(v) => setCode(v.replace(/\D/g, '').slice(0, 6))}
            autoFocus
            keyboardType="number-pad"
            placeholder="000000"
            placeholderTextColor={t.textTer}
            maxLength={6}
            style={[
              inputStyle(t),
              { fontSize: 22, textAlign: 'center', letterSpacing: 8, fontWeight: '700' },
            ]}
          />
          {isGoogleOnly ? (
            <Text
              style={{
                fontSize: 12,
                color: t.textSec,
                marginTop: 10,
                lineHeight: 17,
              }}
            >
              {tStr(lang, 'googleReauthHint')}
            </Text>
          ) : (
            <View style={{ marginTop: 14 }}>
              {fieldLabel(t, tStr(lang, 'currentPassword'))}
              <AppTextInput
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                placeholder="••••••••"
                placeholderTextColor={t.textTer}
                maxLength={128}
                style={inputStyle(t)}
              />
            </View>
          )}
          {errorText(t, err)}
          {dangerBtn(tStr(lang, 'deleteAccount'), confirm, busy)}
        </>
      )}
    </SheetContainer>
  );
};

const StepIndicator: React.FC<{ t: Tokens; step: 1 | 2 | 3 }> = ({ t, step }) => (
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
