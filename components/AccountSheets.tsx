import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { ApiError } from '../lib/api';
import { tStr } from '../lib/i18n';
import { actions, useStore } from '../lib/store';
import { toast } from '../lib/toast';
import type { Tokens } from '../lib/tokens';
import { Icon } from './Icon';

type SheetProps = { t: Tokens; visible: boolean; onClose: () => void };

const SheetContainer: React.FC<{
  t: Tokens;
  visible: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}> = ({ t, visible, onClose, title, children }) => (
  <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
    <Pressable
      onPress={onClose}
      style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' }}
    >
      <Pressable
        onPress={() => {}}
        style={{
          backgroundColor: t.sheetBg,
          borderTopLeftRadius: 28,
          borderTopRightRadius: 28,
          paddingHorizontal: 22,
          paddingTop: 12,
          paddingBottom: 34,
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
        {children}
      </Pressable>
    </Pressable>
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

const extractError = (e: unknown, lang: 'uz' | string = 'en'): string => {
  const isUz = lang === 'uz';
  if (e instanceof TypeError) {
    return isUz ? "Serverga ulanib bo'lmadi. Internetni tekshiring." : 'Cannot reach the server.';
  }
  if (e instanceof ApiError) {
    const map: Record<string, { en: string; uz: string }> = {
      invalid_code: { en: 'Invalid code', uz: "Kod noto'g'ri" },
      code_expired: {
        en: 'Code expired. Request a new one.',
        uz: 'Kod muddati tugagan. Yangi kod oling.',
      },
      too_many_attempts: {
        en: 'Too many attempts. Try again later.',
        uz: 'Urinishlar ko‘p. Keyinroq urinib ko‘ring.',
      },
      email_taken: {
        en: 'This email is already registered',
        uz: "Bu email allaqachon ro'yxatdan o'tgan",
      },
      same_email: { en: 'This is already your email', uz: 'Bu sizning emailingiz' },
      mail_send_failed: {
        en: 'Could not send email. Try again later.',
        uz: 'Emailni yuborib bo‘lmadi. Keyinroq urinib ko‘ring.',
      },
    };
    const m = map[e.message];
    if (m) return isUz ? m.uz : m.en;
    return e.message;
  }
  if (e instanceof Error) return e.message;
  return 'unknown_error';
};

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
      title={lang === 'uz' ? 'Ismni tahrirlash' : 'Edit name'}
    >
      {fieldLabel(t, tStr(lang, 'name'))}
      <TextInput
        value={name}
        onChangeText={setName}
        autoFocus
        placeholder="Your name"
        placeholderTextColor={t.textTer}
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
      toast(lang === 'uz' ? 'Kod yuborildi' : 'Code sent');
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
      toast(lang === 'uz' ? 'Email yangilandi' : 'Email updated');
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
      title={lang === 'uz' ? 'Emailni tahrirlash' : 'Edit email'}
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
            {lang === 'uz'
              ? "Yangi email kiriting. Unga 6 xonali kod yuboriladi."
              : 'Enter the new email. A 6-digit code will be sent to it.'}
          </Text>
          {fieldLabel(t, lang === 'uz' ? 'Yangi email' : 'New email')}
          <TextInput
            value={newEmail}
            onChangeText={setNewEmail}
            autoFocus
            autoCapitalize="none"
            keyboardType="email-address"
            placeholder="you@example.com"
            placeholderTextColor={t.textTer}
            style={inputStyle(t)}
          />
          {errorText(t, err)}
          {primaryBtn(t, lang === 'uz' ? 'Kod yuborish' : 'Send code', requestCode, busy)}
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
            {lang === 'uz'
              ? `${newEmail} ga yuborilgan 6 xonali kodni kiriting.`
              : `Enter the 6-digit code sent to ${newEmail}.`}
          </Text>
          {fieldLabel(t, lang === 'uz' ? 'Tasdiqlash kodi' : 'Verification code')}
          <TextInput
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
          {primaryBtn(
            t,
            lang === 'uz' ? 'Tasdiqlash' : 'Verify',
            verify,
            busy,
          )}
          <Pressable onPress={() => setStep(1)} style={{ alignItems: 'center', marginTop: 12 }}>
            <Text style={{ color: t.accent, fontSize: 14, fontWeight: '600' }}>
              {lang === 'uz' ? 'Boshqa email' : 'Use different email'}
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
      setErr(lang === 'uz' ? "Email noto'g'ri" : 'Invalid email');
      return;
    }
    setBusy(true);
    try {
      await actions.forgotPassword(trimmed);
      toast(lang === 'uz' ? 'Kod yuborildi' : 'Code sent');
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
      setErr(lang === 'uz' ? '6 xonali kodni kiriting' : 'Enter the 6-digit code');
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
    if (newPassword.length < 6) {
      setErr(lang === 'uz' ? 'Parol kamida 6 belgi' : 'Password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErr(lang === 'uz' ? "Parollar mos kelmadi" : 'Passwords do not match');
      return;
    }
    setBusy(true);
    try {
      await actions.resetPassword(email, code, newPassword);
      toast(lang === 'uz' ? 'Parol yangilandi' : 'Password reset');
      onClose();
    } catch (e) {
      setErr(extractError(e, lang));
    } finally {
      setBusy(false);
    }
  };

  const stepTitle =
    step === 1
      ? lang === 'uz'
        ? 'Parolni tiklash'
        : 'Reset password'
      : step === 2
        ? lang === 'uz'
          ? 'Kodni tasdiqlash'
          : 'Verify code'
        : lang === 'uz'
          ? 'Yangi parol'
          : 'New password';

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
            {lang === 'uz'
              ? "Email manzilingizni kiriting, 6 xonali kod yuboriladi."
              : "Enter your email and we'll send you a 6-digit code."}
          </Text>
          {fieldLabel(t, tStr(lang, 'email'))}
          <TextInput
            value={email}
            onChangeText={setEmail}
            autoFocus
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            placeholder="you@example.com"
            placeholderTextColor={t.textTer}
            style={inputStyle(t)}
          />
          {errorText(t, err)}
          {primaryBtn(t, lang === 'uz' ? 'Kod yuborish' : 'Send code', sendCode, busy)}
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
            {lang === 'uz'
              ? `${email} ga yuborilgan 6 xonali kodni kiriting.`
              : `Enter the 6-digit code sent to ${email}.`}
          </Text>
          {fieldLabel(t, lang === 'uz' ? 'Tasdiqlash kodi' : 'Verification code')}
          <TextInput
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
          {primaryBtn(t, lang === 'uz' ? 'Tasdiqlash' : 'Verify', verifyCode, busy)}
          <Pressable
            onPress={() => !busy && setStep(1)}
            style={{ alignItems: 'center', marginTop: 12 }}
          >
            <Text style={{ color: t.accent, fontSize: 14, fontWeight: '600' }}>
              {lang === 'uz' ? 'Boshqa email' : 'Use different email'}
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
            {lang === 'uz'
              ? 'Yangi parolni kiriting va takrorlang.'
              : 'Enter and confirm your new password.'}
          </Text>
          {fieldLabel(t, lang === 'uz' ? 'Yangi parol' : 'New password')}
          <TextInput
            value={newPassword}
            onChangeText={setNewPassword}
            autoFocus
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            placeholder="••••••••"
            placeholderTextColor={t.textTer}
            style={inputStyle(t)}
          />
          <View style={{ height: 14 }} />
          {fieldLabel(t, lang === 'uz' ? 'Parolni takrorlang' : 'Confirm password')}
          <TextInput
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            placeholder="••••••••"
            placeholderTextColor={t.textTer}
            style={inputStyle(t)}
          />
          {errorText(t, err)}
          {primaryBtn(t, lang === 'uz' ? 'Parolni saqlash' : 'Save password', reset, busy)}
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
