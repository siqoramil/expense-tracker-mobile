import Constants from 'expo-constants';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { AppTextInput } from './AppTextInput';
import { authApi } from '../lib/api';
import { errorMessage } from '../lib/errors';
import { isGoogleAuthAvailable, useGoogleIdTokenAuthRequest } from '../lib/googleAuth';
import { tStr } from '../lib/i18n';
import { actions, store } from '../lib/store';
import type { Tokens } from '../lib/tokens';
import { ForgotPasswordSheet } from './AccountSheets';
import { Icon } from './Icon';
import { KeyboardSpacer } from './KeyboardAvoider';
import { Card } from './ui';

type GoogleConfig = {
  googleWebClientId?: string;
  googleIosClientId?: string;
  googleAndroidClientId?: string;
};
const gx = (Constants.expoConfig?.extra ?? {}) as GoogleConfig;

export const LoginScreen: React.FC<{ t: Tokens; onDone: () => void }> = ({ t, onDone }) => {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [forgot, setForgot] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const lang = store.get().prefs.lang;

  const googleEnabled =
    isGoogleAuthAvailable() &&
    !!(gx.googleWebClientId || gx.googleIosClientId || gx.googleAndroidClientId);
  const [googleRequest, googleResponse, googlePrompt] = useGoogleIdTokenAuthRequest({
    webClientId: gx.googleWebClientId,
    iosClientId: gx.googleIosClientId,
    androidClientId: gx.googleAndroidClientId,
  });

  useEffect(() => {
    if (googleResponse?.type !== 'success') return;
    const idToken = googleResponse.params?.id_token;
    if (!idToken) return;
    let cancelled = false;
    (async () => {
      setErr(null);
      setBusy(true);
      try {
        const { token, user } = await authApi.google({ idToken });
        if (cancelled) return;
        await actions.setAuth(token, user);
        onDone();
      } catch (e) {
        if (cancelled) return;
        setErr(errorMessage(lang, e));
      } finally {
        if (!cancelled) setBusy(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [googleResponse]);

  const handleGooglePress = async () => {
    if (!isGoogleAuthAvailable()) {
      setErr(
        lang === 'uz'
          ? 'Dev client eski — qayta build qiling: npx expo run:android'
          : 'Old dev client — rebuild required: npx expo run:android',
      );
      return;
    }
    if (!googleRequest) {
      setErr(
        lang === 'uz'
          ? "Google so'rov hali tayyor emas, biroz kuting"
          : 'Google request not ready, please wait',
      );
      return;
    }
    if (!googleEnabled) {
      setErr(lang === 'uz' ? 'Google sozlanmagan' : 'Google sign-in not configured');
      return;
    }
    setErr(null);
    try {
      const result = await googlePrompt();
      if (result?.type === 'error') {
        setErr(lang === 'uz' ? "Google bilan kirib bo'lmadi" : 'Google sign-in failed');
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message.toLowerCase() : '';
      if (/cancel|dismiss|user.?closed|aborted/.test(msg)) return;
      setErr(
        lang === 'uz' ? `Google: ${msg || "kirib bo'lmadi"}` : `Google: ${msg || 'sign-in failed'}`,
      );
    }
  };

  const submit = async () => {
    setErr(null);
    const emailTrim = email.trim().toLowerCase();
    if (!emailTrim || !pw) {
      setErr(lang === 'uz' ? "Email va parolni to'ldiring" : 'Fill in email and password');
      return;
    }
    if (mode === 'signup' && !name.trim()) {
      setErr(lang === 'uz' ? 'Ismni kiriting' : 'Enter your name');
      return;
    }
    // Only enforce strength on sign-up — existing accounts may pre-date the
    // current rule. Mirrors the server's PASSWORD_PATTERN
    // (^(?=.*[A-Za-z])(?=.*\d).{8,128}$) so the client doesn't ship a
    // request the server will reject.
    if (mode === 'signup') {
      const strong = /^(?=.*[A-Za-z])(?=.*\d).{8,128}$/.test(pw);
      if (!strong) {
        setErr(
          lang === 'uz'
            ? "Parol kamida 8 belgi, harf va raqamdan iborat bo'lsin"
            : 'Password must be at least 8 characters with a letter and a digit',
        );
        return;
      }
    } else if (pw.length < 1) {
      return;
    }

    setBusy(true);
    try {
      const { token, user } =
        mode === 'signin'
          ? await authApi.login({ email: emailTrim, password: pw })
          : await authApi.register({ email: emailTrim, password: pw, name: name.trim() });
      actions.setAuth(token, user);
      onDone();
    } catch (e) {
      setErr(errorMessage(lang, e));
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

  return (
    <ScrollView
      contentContainerStyle={{
        flexGrow: 1,
        backgroundColor: t.bg,
        paddingTop: 48,
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
            source={require('../assets/images/icon.png')}
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
          {mode === 'signin'
            ? lang === 'uz'
              ? 'Hisobingizga kiring'
              : 'Sign in to continue'
            : lang === 'uz'
              ? 'Yangi hisob yarating'
              : 'Create your account'}
        </Text>
      </View>

      {mode === 'signup' ? (
        <View style={{ marginBottom: 14 }}>
          <Label>{tStr(lang, 'name').toUpperCase()}</Label>
          <Card t={t} style={{ borderRadius: 8, paddingHorizontal: 16, paddingVertical: 14 }}>
            <AppTextInput
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
              autoComplete="off"
              importantForAutofill="no"
              textContentType="none"
              placeholder="John Doe"
              maxLength={80}
              style={inputStyle}
              placeholderTextColor={t.textTer}
            />
          </Card>
        </View>
      ) : null}
      <View style={{ marginBottom: 14 }}>
        <Label>{tStr(lang, 'email').toUpperCase()}</Label>
        <Card t={t} style={{ borderRadius: 8, paddingHorizontal: 16, paddingVertical: 14 }}>
          <AppTextInput
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            autoComplete="off"
            importantForAutofill="no"
            textContentType="none"
            keyboardType="email-address"
            placeholder="email@gmail.com"
            maxLength={200}
            style={inputStyle}
            placeholderTextColor={t.textTer}
          />
        </Card>
      </View>
      <View style={{ marginBottom: 14 }}>
        <Label>{tStr(lang, 'password').toUpperCase()}</Label>
        <Card t={t} style={{ borderRadius: 8, paddingHorizontal: 16, paddingVertical: 14 }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
            }}
          >
            <AppTextInput
              value={pw}
              onChangeText={setPw}
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
      </View>

      {mode === 'signin' ? (
        <Pressable
          onPress={() => setForgot(true)}
          style={{ alignSelf: 'flex-end', marginBottom: 14 }}
          hitSlop={8}
        >
          <Text style={{ color: t.accent, fontSize: 13, fontWeight: '600' }}>
            {lang === 'uz' ? 'Parolni unutdingizmi?' : 'Forgot password?'}
          </Text>
        </Pressable>
      ) : null}

      {err ? (
        <View
          style={{
            backgroundColor: t.expenseSoft,
            borderRadius: 12,
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
            borderRadius: 8,
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
            borderRadius: 8,
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
          {lang === 'uz' ? 'Google bilan davom eting' : 'Continue with Google'}
        </Text>
      </Pressable>

      <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ fontSize: 13.5, color: t.textSec }}>
          {mode === 'signin'
            ? tStr(lang, 'noAccount')
            : lang === 'uz'
              ? 'Hisobingiz bormi?'
              : 'Already have an account?'}{' '}
        </Text>
        <Pressable
          onPress={() => {
            setErr(null);
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
      <KeyboardSpacer />
    </ScrollView>
  );
};
