import * as Google from 'expo-auth-session/providers/google';
import Constants from 'expo-constants';
import * as WebBrowser from 'expo-web-browser';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { ApiError, authApi } from '../lib/api';
import { tStr } from '../lib/i18n';
import { actions, store } from '../lib/store';
import type { Tokens } from '../lib/tokens';
import { ForgotPasswordSheet } from './AccountSheets';
import { Icon } from './Icon';

WebBrowser.maybeCompleteAuthSession();

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

  const googleEnabled = !!(gx.googleWebClientId || gx.googleIosClientId || gx.googleAndroidClientId);
  const [googleRequest, googleResponse, googlePrompt] = Google.useIdTokenAuthRequest({
    webClientId: gx.googleWebClientId,
    iosClientId: gx.googleIosClientId,
    androidClientId: gx.googleAndroidClientId,
  });

  const friendly = (code: string): string => {
    const mappings: Record<string, { en: string; uz: string }> = {
      invalid_credentials: {
        en: 'Invalid email or password',
        uz: "Email yoki parol noto'g'ri",
      },
      email_taken: {
        en: 'This email is already registered',
        uz: "Bu email allaqachon ro'yxatdan o'tgan",
      },
      network_error: {
        en: 'Cannot reach the server. Check your connection.',
        uz: "Serverga ulanib bo'lmadi. Internetni tekshiring.",
      },
    };
    const m = mappings[code];
    if (m) return lang === 'uz' ? m.uz : m.en;
    return code;
  };

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
        actions.setAuth(token, user);
        onDone();
      } catch (e) {
        if (cancelled) return;
        if (e instanceof ApiError) setErr(friendly(e.message));
        else if (e instanceof TypeError) setErr(friendly('network_error'));
        else setErr(lang === 'uz' ? "Google bilan kirib bo'lmadi" : 'Google sign-in failed');
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
    if (!googleEnabled) {
      setErr(lang === 'uz' ? 'Google sozlanmagan' : 'Google sign-in not configured');
      return;
    }
    setErr(null);
    try {
      await googlePrompt();
    } catch {
      setErr(lang === 'uz' ? "Google bilan kirib bo'lmadi" : 'Google sign-in failed');
    }
  };

  const submit = async () => {
    setErr(null);
    const emailTrim = email.trim().toLowerCase();
    if (!emailTrim || !pw) {
      setErr(lang === 'uz' ? 'Email va parolni to\'ldiring' : 'Fill in email and password');
      return;
    }
    if (mode === 'signup' && !name.trim()) {
      setErr(lang === 'uz' ? 'Ismni kiriting' : 'Enter your name');
      return;
    }
    if (pw.length < 6) {
      setErr(
        lang === 'uz' ? 'Parol kamida 6 belgi bo\'lsin' : 'Password must be at least 6 characters',
      );
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
      if (e instanceof ApiError) {
        setErr(friendly(e.message));
      } else if (e instanceof TypeError) {
        setErr(friendly('network_error'));
      } else if (e instanceof Error) {
        setErr(e.message);
      } else {
        setErr('unknown_error');
      }
    } finally {
      setBusy(false);
    }
  };

  const inputStyle = {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    backgroundColor: t.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: t.border,
    color: t.text,
    fontSize: 15,
  };

  const labelStyle = {
    fontSize: 12,
    color: t.textSec,
    fontWeight: '600' as const,
    marginBottom: 6,
    letterSpacing: 0.3,
  };

  return (
    <ScrollView
      contentContainerStyle={{
        flexGrow: 1,
        backgroundColor: t.bg,
        paddingTop: 24,
        paddingHorizontal: 28,
        paddingBottom: 24,
      }}
      keyboardShouldPersistTaps="handled"
    >
      <View
        style={{
          width: 56,
          height: 56,
          borderRadius: 16,
          backgroundColor: t.accent,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 28,
          shadowColor: t.accent,
          shadowOpacity: 0.3,
          shadowRadius: 24,
          shadowOffset: { width: 0, height: 8 },
          elevation: 6,
        }}
      >
        <Icon name="wallet" size={28} color="#fff" stroke={2.2} />
      </View>

      <Text
        style={{
          fontSize: 30,
          fontWeight: '700',
          color: t.text,
          letterSpacing: -0.8,
          marginBottom: 6,
        }}
      >
        {mode === 'signin' ? tStr(lang, 'welcome') : tStr(lang, 'signUp')}
      </Text>
      <Text style={{ fontSize: 14, color: t.textSec, marginBottom: 32 }}>
        {mode === 'signin' ? 'Sign in to continue to Expense Tracker' : 'Create your Expense Tracker account'}
      </Text>

      <View style={{ gap: 12, marginBottom: 16 }}>
        {mode === 'signup' ? (
          <View>
            <Text style={labelStyle}>{tStr(lang, 'name').toUpperCase()}</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
              placeholder="Your full name"
              style={inputStyle}
              placeholderTextColor={t.textTer}
            />
          </View>
        ) : null}
        <View>
          <Text style={labelStyle}>{tStr(lang, 'email').toUpperCase()}</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            placeholder="you@example.com"
            style={inputStyle}
            placeholderTextColor={t.textTer}
          />
        </View>
        <View>
          <Text style={labelStyle}>{tStr(lang, 'password').toUpperCase()}</Text>
          <View style={{ position: 'relative', justifyContent: 'center' }}>
            <TextInput
              value={pw}
              onChangeText={setPw}
              secureTextEntry={!showPw}
              autoCapitalize="none"
              autoCorrect={false}
              placeholder="••••••••"
              style={[inputStyle, { paddingRight: 48 }]}
              placeholderTextColor={t.textTer}
            />
            <Pressable
              onPress={() => setShowPw((v) => !v)}
              hitSlop={10}
              style={{
                position: 'absolute',
                right: 8,
                top: 0,
                bottom: 0,
                width: 40,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Icon name={showPw ? 'eye-off' : 'eye'} size={18} color={t.textSec} />
            </Pressable>
          </View>
          {mode === 'signin' ? (
            <Pressable
              onPress={() => setForgot(true)}
              style={{ alignSelf: 'flex-end', marginTop: 8 }}
              hitSlop={8}
            >
              <Text style={{ color: t.accent, fontSize: 13, fontWeight: '600' }}>
                {lang === 'uz' ? 'Parolni unutdingizmi?' : 'Forgot password?'}
              </Text>
            </Pressable>
          ) : null}
        </View>
      </View>

      {err ? (
        <Text
          style={{
            color: t.expense,
            fontSize: 13,
            fontWeight: '500',
            marginBottom: 12,
          }}
        >
          {err}
        </Text>
      ) : null}

      <Pressable
        onPress={busy ? undefined : submit}
        style={{
          height: 52,
          borderRadius: 14,
          backgroundColor: t.accent,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 20,
          opacity: busy ? 0.7 : 1,
          shadowColor: t.accent,
          shadowOpacity: 0.25,
          shadowRadius: 14,
          shadowOffset: { width: 0, height: 4 },
          elevation: 4,
        }}
      >
        {busy ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700', letterSpacing: 0.2 }}>
            {mode === 'signin' ? tStr(lang, 'signIn') : tStr(lang, 'signUp')}
          </Text>
        )}
      </Pressable>

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 20 }}>
        <View style={{ flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: t.divider }} />
        <Text style={{ fontSize: 12, color: t.textTer }}>{tStr(lang, 'orContinue')}</Text>
        <View style={{ flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: t.divider }} />
      </View>

      <Pressable
        onPress={busy || !googleRequest ? undefined : handleGooglePress}
        style={({ pressed }) => [
          {
            alignSelf: 'center',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            paddingVertical: 13,
            paddingHorizontal: 28,
            borderRadius: 14,
            backgroundColor: t.surface,
            borderWidth: StyleSheet.hairlineWidth,
            borderColor: t.border,
            marginBottom: 28,
            opacity: !googleRequest || busy ? 0.6 : 1,
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
        <Text style={{ color: t.text, fontSize: 14, fontWeight: '600' }}>
          {lang === 'uz' ? 'Google bilan davom eting' : 'Continue with Google'}
        </Text>
      </Pressable>

      <View style={{ flexDirection: 'row', justifyContent: 'center' }}>
        <Text style={{ fontSize: 13, color: t.textSec }}>
          {mode === 'signin' ? tStr(lang, 'noAccount') : 'Already have an account?'}{' '}
        </Text>
        <Pressable
          onPress={() => {
            setErr(null);
            setMode(mode === 'signin' ? 'signup' : 'signin');
          }}
        >
          <Text style={{ color: t.accent, fontWeight: '600', fontSize: 13 }}>
            {mode === 'signin' ? tStr(lang, 'signUp') : tStr(lang, 'signIn')}
          </Text>
        </Pressable>
      </View>

      <ForgotPasswordSheet t={t} visible={forgot} onClose={() => setForgot(false)} />
    </ScrollView>
  );
};
