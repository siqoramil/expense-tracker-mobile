import React, { useState } from 'react';
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View, } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import Svg, { Path } from 'react-native-svg';
import type { Tokens } from '@/lib/tokens';
import { AppTextInput } from '@/components/AppTextInput';
import { Card } from '@/components/ui';
import { ForgotPasswordSheet } from '@/components/AccountSheets';
import { Icon } from '@/components/Icon';
import { NetworkError, authApi } from '@/lib/api';
import { actions, store } from '@/lib/store';
import { errorMessage } from '@/lib/errors';
import { isGoogleAuthAvailable, signInWithGoogle } from '@/lib/googleAuth';
import { tStr } from '@/lib/i18n';

export const LoginScreen: React.FC<{ t: Tokens; onDone: () => void }> = ({ t, onDone }) => {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [pw, setPw] = useState<string>('');
  const [showPw, setShowPw] = useState<boolean>(false);
  const [focused, setFocused] = useState<'name' | 'email' | 'password' | null>(null);
  const [forgot, setForgot] = useState<boolean>(false);
  const [busy, setBusy] = useState<boolean>(false);
  const [err, setErr] = useState<string | null>(null);
  const [fieldErr, setFieldErr] = useState<{ name?: string; email?: string; password?: string }>(
    {},
  );
  const lang = store.get().prefs.lang;

  const clearField = (k: 'name' | 'email' | 'password') =>
    setFieldErr((prev) => (prev[k] ? { ...prev, [k]: undefined } : prev));

  const clearFieldAndErr = (k: 'name' | 'email' | 'password') => {
    clearField(k);
    setErr(null);
  };

  const googleEnabled = isGoogleAuthAvailable();

  const handleGooglePress = async () => {
    if (!googleEnabled) {
      setErr(tStr(lang, 'err_google_unavailable'));
      return;
    }
    setErr(null);
    setBusy(true);
    try {
      const res = await signInWithGoogle();
      if (res.type === 'cancel') return;
      if (res.type === 'error') {
        setErr(tStr(lang, 'err_google_sign_in_failed'));
        return;
      }
      const { token, user } = await authApi.google({ idToken: res.idToken });
      await actions.setAuth(token, user);
      onDone();
    } catch (e) {
      if (!(e instanceof NetworkError)) setErr(errorMessage(lang, e));
    } finally {
      setBusy(false);
    }
  };

  const submit = async () => {
    setErr(null);
    const emailTrim = email.trim().toLowerCase();
    const fe: { name?: string; email?: string; password?: string } = {};

    if (mode === 'signup' && !name.trim()) {
      fe.name = tStr(lang, 'val_name_required');
    }

    if (!emailTrim) {
      fe.email = tStr(lang, 'val_email_required');
    } else if (!/^[^\s@.][^\s@]*@[^\s@]+\.[^\s@]{2,}$/.test(emailTrim)) {
      fe.email = tStr(lang, 'val_email_invalid');
    }

    if (!pw.trim()) {
      fe.password = tStr(lang, 'val_password_required');
    } else if (mode === 'signup' && !/^(?=.*[A-Za-z])(?=.*\d).{8,128}$/.test(pw)) {
      // Only enforce strength on sign-up — existing accounts may pre-date the
      // current rule. Mirrors the server's PASSWORD_PATTERN
      // (^(?=.*[A-Za-z])(?=.*\d).{8,128}$) so the client doesn't ship a
      // request the server will reject.
      fe.password = tStr(lang, 'val_password_weak');
    }

    if (fe.name || fe.email || fe.password) {
      setFieldErr(fe);
      return;
    }
    setFieldErr({});

    setBusy(true);
    try {
      const { token, user } =
        mode === 'signin'
          ? await authApi.login({ email: emailTrim, password: pw })
          : await authApi.register({ email: emailTrim, password: pw, name: name.trim() });
      await actions.setAuth(token, user);
      onDone();
    } catch (e) {
      if (!(e instanceof NetworkError)) setErr(errorMessage(lang, e));
    } finally {
      setBusy(false);
    }
  };

  const Label: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <Text
      style={{
        fontSize: 11,
        fontWeight: '600',
        color: t.textSec,
        letterSpacing: 0.6,
        marginBottom: 8,
        marginLeft: 4,
      }}
    >
      {children}
    </Text>
  );

  const inputStyle = {
    color: t.text,
    fontSize: 16,
    fontWeight: '500' as const,
    letterSpacing: 0.3,
    padding: 0,
    margin: 0,
  };

  const cardStyle = (hasError: boolean, isFocused: boolean) => ({
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1.5,
    borderColor: hasError ? t.expense : isFocused ? t.accent : t.border,
    ...(isFocused && !hasError
      ? {
          shadowColor: t.accent,
          shadowOpacity: 0.18,
          shadowRadius: 10,
          shadowOffset: { width: 0, height: 4 },
          elevation: 3,
        }
      : null),
  });

  const FieldError: React.FC<{ msg?: string }> = ({ msg }) =>
    msg ? (
      <Text
        accessibilityLiveRegion="polite"
        style={{ color: t.expense, fontSize: 12, fontWeight: '500', marginTop: 6, marginLeft: 4 }}
      >
        {msg}
      </Text>
    ) : null;

  return (
    <KeyboardAwareScrollView
      bottomOffset={20}
      contentContainerStyle={{
        flexGrow: 1,
        justifyContent: 'center',
        backgroundColor: t.bg,
        paddingTop: 40,
        paddingHorizontal: 20,
        paddingBottom: 40,
      }}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <View style={{ alignItems: 'center', marginBottom: 32 }}>
        <View
          style={{
            width: 136,
            height: 136,
            borderRadius: 31,
            overflow: 'hidden',
            shadowColor: t.accent,
            shadowOpacity: 0.32,
            shadowRadius: 32,
            shadowOffset: { width: 0, height: 16 },
            elevation: 16,
            marginBottom: 24,
          }}
        >
          <Image
            source={require('../../assets/images/icon.png')}
            style={{ width: 136, height: 136 }}
            resizeMode="cover"
          />
        </View>

        <Text
          style={{
            fontSize: 30,
            fontWeight: '700',
            color: t.text,
            letterSpacing: -0.7,
            marginBottom: 6,
            textAlign: 'center',
          }}
        >
          {mode === 'signin' ? tStr(lang, 'welcome') : tStr(lang, 'signUp')}
        </Text>
        <Text
          style={{
            fontSize: 14,
            color: t.textSec,
            textAlign: 'center',
            paddingHorizontal: 12,
          }}
        >
          {mode === 'signin' ? tStr(lang, 'login_subtitle') : tStr(lang, 'signup_subtitle')}
        </Text>
      </View>

      {mode === 'signup' ? (
        <View style={{ marginBottom: 14 }}>
          <Label>{tStr(lang, 'name').toUpperCase()}</Label>
          <Card t={t} style={cardStyle(!!fieldErr.name, focused === 'name')}>
            <View style={styles.fieldRow}>
              <Icon
                name="user"
                size={18}
                color={focused === 'name' ? t.accent : t.textTer}
              />
              <AppTextInput
                value={name}
                onChangeText={(v) => {
                  setName(v);
                  clearFieldAndErr('name');
                }}
                onFocus={() => setFocused('name')}
                onBlur={() => setFocused(null)}
                autoCapitalize="words"
                autoComplete="off"
                importantForAutofill="no"
                textContentType="none"
                placeholder="John Doe"
                maxLength={80}
                style={[inputStyle, { flex: 1 }]}
                placeholderTextColor={t.textTer}
              />
            </View>
          </Card>
          <FieldError msg={fieldErr.name} />
        </View>
      ) : null}
      <View style={{ marginBottom: 14 }}>
        <Label>{tStr(lang, 'email').toUpperCase()}</Label>
        <Card t={t} style={cardStyle(!!fieldErr.email, focused === 'email')}>
          <View style={styles.fieldRow}>
            <Icon
              name="mail"
              size={18}
              color={focused === 'email' ? t.accent : t.textTer}
            />
            <AppTextInput
              value={email}
              onChangeText={(v) => {
                setEmail(v);
                clearFieldAndErr('email');
              }}
              onFocus={() => setFocused('email')}
              onBlur={() => setFocused(null)}
              autoCapitalize="none"
              autoComplete="off"
              importantForAutofill="no"
              textContentType="none"
              keyboardType="email-address"
              placeholder="email@gmail.com"
              maxLength={200}
              style={[inputStyle, { flex: 1 }]}
              placeholderTextColor={t.textTer}
            />
          </View>
        </Card>
        <FieldError msg={fieldErr.email} />
      </View>
      <View style={{ marginBottom: 14 }}>
        <Label>{tStr(lang, 'password').toUpperCase()}</Label>
        <Card t={t} style={cardStyle(!!fieldErr.password, focused === 'password')}>
          <View style={styles.fieldRow}>
            <Icon
              name="lock"
              size={18}
              color={focused === 'password' ? t.accent : t.textTer}
            />
            <AppTextInput
              value={pw}
              onChangeText={(v) => {
                setPw(v);
                clearFieldAndErr('password');
              }}
              onFocus={() => setFocused('password')}
              onBlur={() => setFocused(null)}
              secureTextEntry={!showPw}
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="off"
              importantForAutofill="no"
              textContentType="none"
              placeholder="••••••••"
              maxLength={128}
              style={[inputStyle, { flex: 1 }]}
              placeholderTextColor={t.textTer}
            />
            <Pressable onPress={() => setShowPw((v) => !v)} hitSlop={12}>
              <Icon name={showPw ? 'eye-off' : 'eye'} size={18} color={t.textSec} />
            </Pressable>
          </View>
        </Card>
        <FieldError msg={fieldErr.password} />
      </View>

      {mode === 'signin' ? (
        <Pressable
          onPress={() => setForgot(true)}
          style={{ alignSelf: 'flex-end', marginBottom: 14 }}
          hitSlop={8}
        >
          <Text style={{ color: t.accent, fontSize: 13, fontWeight: '600' }}>
            {tStr(lang, 'forgotPassword')}
          </Text>
        </Pressable>
      ) : null}

      {err ? (
        <View
          style={{
            backgroundColor: t.expenseSoft,
            borderRadius: 14,
            paddingHorizontal: 14,
            paddingVertical: 10,
            marginBottom: 14,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <Icon name="info" size={16} color={t.expense} />
          <Text style={{ color: t.expense, fontSize: 13, fontWeight: '500', flex: 1 }}>{err}</Text>
        </View>
      ) : null}

      <Pressable
        onPress={busy ? undefined : submit}
        style={({ pressed }) => [
          {
            height: 54,
            borderRadius: 14,
            backgroundColor: t.accent,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 18,
            opacity: busy ? 0.7 : 1,
            shadowColor: t.accent,
            shadowOpacity: 0.32,
            shadowRadius: 16,
            shadowOffset: { width: 0, height: 8 },
            elevation: 8,
          },
          pressed && !busy && { transform: [{ scale: 0.98 }] },
        ]}
      >
        {busy ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700', letterSpacing: 0.2 }}>
            {mode === 'signin' ? tStr(lang, 'signIn') : tStr(lang, 'signUp')}
          </Text>
        )}
      </Pressable>

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <View style={{ flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: t.divider }} />
        <Text style={{ fontSize: 12, color: t.textTer, letterSpacing: 0.3 }}>
          {tStr(lang, 'orContinue').toUpperCase()}
        </Text>
        <View style={{ flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: t.divider }} />
      </View>

      <Pressable
        onPress={busy ? undefined : handleGooglePress}
        style={({ pressed }) => [
          {
            height: 54,
            borderRadius: 14,
            backgroundColor: t.surface,
            borderWidth: StyleSheet.hairlineWidth,
            borderColor: t.border,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            marginBottom: 28,
            opacity: busy ? 0.6 : 1,
          },
          pressed && !busy && { opacity: 0.85, transform: [{ scale: 0.98 }] },
        ]}
      >
        <Svg width={18} height={18} viewBox="0 0 18 18">
          <Path
            d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.49h4.84a4.13 4.13 0 0 1-1.79 2.71v2.26h2.9c1.7-1.56 2.69-3.87 2.69-6.62z"
            fill="#4285F4"
          />
          <Path
            d="M9 18c2.43 0 4.47-.81 5.96-2.18l-2.9-2.26c-.8.54-1.83.86-3.06.86-2.35 0-4.34-1.59-5.05-3.72H.96v2.33A9 9 0 0 0 9 18z"
            fill="#34A853"
          />
          <Path
            d="M3.95 10.7A5.4 5.4 0 0 1 3.66 9c0-.59.1-1.16.29-1.7V4.97H.96A9 9 0 0 0 0 9c0 1.45.35 2.82.96 4.03l2.99-2.33z"
            fill="#FBBC05"
          />
          <Path
            d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58A9 9 0 0 0 9 0 9 9 0 0 0 .96 4.97L3.95 7.3C4.66 5.17 6.65 3.58 9 3.58z"
            fill="#EA4335"
          />
        </Svg>
        <Text style={{ color: t.text, fontSize: 15, fontWeight: '600' }}>
          {tStr(lang, 'continueWithGoogle')}
        </Text>
      </Pressable>

      <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ fontSize: 13.5, color: t.textSec }}>
          {mode === 'signin' ? tStr(lang, 'noAccount') : tStr(lang, 'haveAccount')}{' '}
        </Text>
        <Pressable
          onPress={() => {
            setErr(null);
            setFieldErr({});
            setName('');
            setPw('');
            setShowPw(false);
            setMode(mode === 'signin' ? 'signup' : 'signin');
          }}
          hitSlop={6}
        >
          <Text style={{ color: t.accent, fontWeight: '700', fontSize: 13.5 }}>
            {mode === 'signin' ? tStr(lang, 'signUp') : tStr(lang, 'signIn')}
          </Text>
        </Pressable>
      </View>

      <ForgotPasswordSheet t={t} visible={forgot} onClose={() => setForgot(false)} />
    </KeyboardAwareScrollView>
  );
};

const styles = StyleSheet.create({
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
});
