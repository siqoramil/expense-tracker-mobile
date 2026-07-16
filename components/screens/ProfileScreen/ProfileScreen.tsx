import React, { useState } from 'react';
import { ActionSheetIOS, Image, Platform, Pressable, ScrollView, StyleSheet, Text, View, } from 'react-native';
import type { Tokens } from '@/lib/tokens';
import { ActionSheet, type ActionSheetConfig } from '@/components/ActionSheet';
import { Card, SectionHeader, Switch } from '@/components/ui';
import { DeleteAccountSheet } from '@/components/AccountSheets';
import { CurrencySheet, LanguageSheet } from '@/components/screens/SettingsSubs';
import { Icon, type IconName } from '@/components/Icon';
import { LANGUAGES, tStr } from '@/lib/i18n';
import { actions, isImageAvatar, useStore } from '@/lib/store';
import { errorMessage } from '@/lib/errors';
import { isGoogleAuthAvailable, signInWithGoogle } from '@/lib/googleAuth';
import { toast } from '@/lib/toast';
import Svg, { Path } from 'react-native-svg';

type ImagePickerModule = typeof import('expo-image-picker');
const loadImagePicker = (): ImagePickerModule | null => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('expo-image-picker') as ImagePickerModule;
  } catch {
    return null;
  }
};

type Nav = (screen: string, data?: unknown) => void;

export const ProfileScreen = ({
  t,
  onNav,
  onLogout,
  contentTopPad = 0,
}: { t: Tokens; onNav: Nav; onLogout: () => void; contentTopPad?: number }) => {
  const s = useStore();
  const lang = s.prefs.lang;
  const [deleteAccountOpen, setDeleteAccountOpen] = useState<boolean>(false);
  const [languageOpen, setLanguageOpen] = useState<boolean>(false);
  const [currencyOpen, setCurrencyOpen] = useState<boolean>(false);
  const [sheetConfig, setSheetConfig] = useState<ActionSheetConfig | null>(null);

  const hasImage = isImageAvatar(s.profile.avatar);

  const pickImage = async () => {
    const ImagePicker = loadImagePicker();
    if (!ImagePicker) {
      toast(tStr(lang, 'imagePickerUnavailable'));
      return;
    }
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (perm.status !== 'granted') {
        toast(tStr(lang, 'permissionDenied'));
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.3,
        base64: true,
      });
      if (result.canceled) return;
      const asset = result.assets[0];
      if (!asset?.base64) return;
      const mime = asset.mimeType ?? 'image/jpeg';
      const uri = `data:${mime};base64,${asset.base64}`;
      // Server caps avatars at ~600KB (auth.ts maxLength on /auth/me). Check
      // client-side so we surface a friendly message instead of a generic 400.
      if (uri.length > 600_000) {
        toast(tStr(lang, 'err_invalid_avatar'));
        return;
      }
      await actions.updateAvatar(uri);
      toast(tStr(lang, 'saved'));
    } catch (err) {
      toast(errorMessage(lang, err));
    }
  };

  const openAvatarMenu = () => {
    if (!hasImage) {
      void pickImage();
      return;
    }
    const labels = {
      title: tStr(lang, 'profilePhoto'),
      library: tStr(lang, 'chooseFromLibrary'),
      remove: tStr(lang, 'removePhoto'),
      cancel: tStr(lang, 'cancel'),
    };
    const options = [labels.library, labels.remove, labels.cancel];
    const cancelIdx = options.length - 1;
    const destructiveIdx = 1;

    const handle = (idx: number) => {
      if (idx === 0) void pickImage();
      else if (idx === 1) void actions.removeAvatar();
    };

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          title: labels.title,
          options,
          cancelButtonIndex: cancelIdx,
          destructiveButtonIndex: destructiveIdx >= 0 ? destructiveIdx : undefined,
        },
        handle,
      );
    } else {
      setSheetConfig({
        title: labels.title,
        options: [
          { label: labels.library, onPress: () => void pickImage() },
          { label: labels.remove, destructive: true, onPress: () => void actions.removeAvatar() },
        ],
      });
    }
  };

  // Link Google to an existing password account. The server refuses to
  // auto-link on sign-in (account-takeover guard), so the user authenticates
  // here while logged in; the matched, verified Google identity is then bound.
  const connectGoogle = async () => {
    if (!isGoogleAuthAvailable()) {
      toast(tStr(lang, 'err_google_unavailable'));
      return;
    }
    try {
      const res = await signInWithGoogle();
      if (res.type === 'cancel') return;
      if (res.type === 'error') {
        toast(tStr(lang, 'err_google_sign_in_failed'));
        return;
      }
      await actions.linkGoogle(res.idToken);
      toast(tStr(lang, 'googleLinked'));
    } catch (e) {
      toast(errorMessage(lang, e));
    }
  };

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 160, paddingTop: contentTopPad }}>
      <View style={{ paddingHorizontal: 20, paddingBottom: 18 }}>
        <Card t={t} style={{ padding: 18 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
            {/* Avatar is the only editable thing here: tap it (or the badge) to
                change the photo, Instagram-style. Name/email live in Account. */}
            <Pressable onPress={openAvatarMenu} hitSlop={6} style={{ width: 64, height: 64 }}>
              <View
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 32,
                  backgroundColor: t.accent,
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                  shadowColor: t.accent,
                  shadowOpacity: 0.3,
                  shadowRadius: 16,
                  shadowOffset: { width: 0, height: 6 },
                  elevation: 6,
                }}
              >
                {hasImage ? (
                  <Image source={{ uri: s.profile.avatar }} style={{ width: 64, height: 64 }} />
                ) : (
                  <Text style={{ fontSize: 23, fontWeight: '700', color: '#fff' }}>
                    {s.profile.avatar}
                  </Text>
                )}
              </View>
              <View
                style={{
                  position: 'absolute',
                  bottom: -2,
                  right: -2,
                  width: 24,
                  height: 24,
                  borderRadius: 12,
                  backgroundColor: t.accent,
                  borderWidth: 2,
                  borderColor: t.surface,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Icon name="pen" size={11} color="#fff" stroke={2.2} />
              </View>
            </Pressable>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text
                style={{ fontSize: 19, fontWeight: '700', color: t.text, letterSpacing: -0.4 }}
                numberOfLines={1}
              >
                {s.profile.name}
              </Text>
              <Text style={{ fontSize: 13, color: t.textSec, marginTop: 3 }} numberOfLines={1}>
                {s.profile.email}
              </Text>
              <View
                style={{
                  flexDirection: 'row',
                  alignSelf: 'flex-start',
                  alignItems: 'center',
                  gap: 5,
                  marginTop: 10,
                  paddingVertical: 4,
                  paddingHorizontal: 10,
                  borderRadius: 8,
                  backgroundColor: t.accentSoft,
                  borderWidth: StyleSheet.hairlineWidth,
                  borderColor: t.accent + '40',
                }}
              >
                <Icon name="check" size={10} color={t.accent} stroke={3} />
                <Text
                  style={{ color: t.accent, fontSize: 11, fontWeight: '700', letterSpacing: 0.4 }}
                >
                  {tStr(lang, 'pro')}
                </Text>
              </View>
            </View>
          </View>
        </Card>
      </View>

      <DeleteAccountSheet
        t={t}
        visible={deleteAccountOpen}
        onClose={() => setDeleteAccountOpen(false)}
        onDeleted={onLogout}
      />
      <LanguageSheet t={t} visible={languageOpen} onClose={() => setLanguageOpen(false)} />
      <CurrencySheet t={t} visible={currencyOpen} onClose={() => setCurrencyOpen(false)} />
      <ActionSheet
        t={t}
        config={sheetConfig}
        cancelLabel={tStr(lang, 'cancel')}
        onClose={() => setSheetConfig(null)}
      />

      <View style={{ paddingHorizontal: 20, paddingBottom: 16 }}>
        <Card t={t}>
          <NavRow
            t={t}
            icon="user"
            color="#6366F1"
            label={tStr(lang, 'account')}
            onPress={() => onNav('account')}
            last
          />
        </Card>
      </View>

      <View style={{ paddingHorizontal: 20, paddingBottom: 16 }}>
        <Card t={t}>
          <NavRow
            t={t}
            icon="gift"
            color="#059669"
            label={tStr(lang, 'goPremium')}
            onPress={() => onNav('premium')}
            last
          />
        </Card>
      </View>

      <SectionHeader t={t} title={tStr(lang, 'preferences')} />
      <View style={{ paddingHorizontal: 20, paddingBottom: 16 }}>
        <Card t={t}>
          <ToggleRow
            t={t}
            icon="moon"
            color="#6366F1"
            label={tStr(lang, 'darkMode')}
            on={s.prefs.dark}
            onChange={(v) => actions.setPref('dark', v)}
          />
          <NavRow
            t={t}
            icon="globe"
            color="#06B6D4"
            label={tStr(lang, 'language')}
            detail={LANGUAGES.find(l => l.code === lang)?.native ?? lang}
            onPress={() => setLanguageOpen(true)}
          />
          <NavRow
            t={t}
            icon="credit-card"
            color="#10B981"
            label={tStr(lang, 'currency')}
            detail={s.prefs.currency}
            onPress={() => setCurrencyOpen(true)}
          />
          <NavRow
            t={t}
            icon="tag"
            color="#F59E0B"
            label={tStr(lang, 'categoriesLabel')}
            detail={String(s.categories.length)}
            onPress={() => onNav('categories')}
            last
          />
        </Card>
      </View>

      <SectionHeader t={t} title={tStr(lang, 'account')} />
      <View style={{ paddingHorizontal: 20, paddingBottom: 16 }}>
        <Card t={t}>
          <NavRow
            t={t}
            icon="wallet"
            color="#EC4899"
            label={tStr(lang, 'wallets')}
            onPress={() => onNav('wallets')}
          />
          <NavRow
            t={t}
            icon="chart"
            color="#10B981"
            label={tStr(lang, 'budgets')}
            onPress={() => onNav('budgets')}
          />
          <NavRow
            t={t}
            icon="calendar"
            color="#3B82F6"
            label={tStr(lang, 'recurring')}
            onPress={() => onNav('recurring')}
          />
          <NavRow
            t={t}
            icon="calendar"
            color="#F97316"
            label={tStr(lang, 'calendar')}
            onPress={() => onNav('calendar')}
          />
          <NavRow
            t={t}
            icon="bell"
            color="#EC4899"
            label={tStr(lang, 'notifications')}
            onPress={() => onNav('notifications')}
          />
          <NavRow
            t={t}
            icon="download"
            color="#0EA5E9"
            label={tStr(lang, 'reports')}
            onPress={() => onNav('reports')}
            last
          />
        </Card>
      </View>

      {s.profile.hasGoogle || isGoogleAuthAvailable() ? (
        <View style={{ paddingHorizontal: 20, paddingBottom: 16 }}>
          <Card t={t}>
            {s.profile.hasGoogle ? (
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 12,
                  paddingVertical: 12,
                  paddingHorizontal: 16,
                }}
              >
                <View
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 9,
                    backgroundColor: '#5F636822',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <GoogleGlyph />
                </View>
                <Text style={{ flex: 1, fontSize: 14.5, color: t.text, fontWeight: '500' }}>
                  {tStr(lang, 'googleLinked')}
                </Text>
                <View
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: 10,
                    backgroundColor: t.income,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Icon name="check" size={12} color="#fff" stroke={3} />
                </View>
              </View>
            ) : (
              <NavRow
                t={t}
                iconNode={<GoogleGlyph />}
                color="#5F6368"
                label={tStr(lang, 'connectGoogle')}
                onPress={connectGoogle}
                last
              />
            )}
          </Card>
        </View>
      ) : null}

      <View style={{ paddingHorizontal: 20, paddingBottom: 16 }}>
        <Card t={t}>
          <NavRow
            t={t}
            icon="arrow-up-right"
            color={t.expense}
            label={tStr(lang, 'signOut')}
            onPress={onLogout}
          />
          <NavRow
            t={t}
            icon="close"
            color={t.expense}
            label={tStr(lang, 'deleteAccount')}
            onPress={() => setDeleteAccountOpen(true)}
            last
          />
        </Card>
      </View>

      <View style={{ paddingHorizontal: 20, alignItems: 'center' }}>
        <Text style={{ fontSize: 11.5, color: t.textTer, fontWeight: '500' }}>
          Expense Tracker v2.4.0 · Tashkent
        </Text>
      </View>
    </ScrollView>
  );
};

export const ToggleRow = ({ t, icon, color, label, on, onChange, last }: { t: Tokens; icon: IconName; color: string; label: string; on: boolean; onChange: (v: boolean) => void; last?: boolean }) => (
  <View
    style={{
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderBottomWidth: last ? 0 : StyleSheet.hairlineWidth,
      borderBottomColor: t.divider,
    }}
  >
    <View
      style={{
        width: 34,
        height: 34,
        borderRadius: 9,
        backgroundColor: color + '22',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Icon name={icon} size={17} color={color} />
    </View>
    <Text style={{ flex: 1, fontSize: 15, color: t.text, fontWeight: '500' }}>{label}</Text>
    <Switch on={on} onChange={onChange} t={t} />
  </View>
);

export const GoogleGlyph = ({ size = 17 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 18 18">
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
);

export const NavRow = ({ t, icon, iconNode, color, label, detail, onPress, last }: { t: Tokens; icon?: IconName; iconNode?: React.ReactNode; color: string; label: string; detail?: string; onPress: () => void; last?: boolean }) => (
  <Pressable
    onPress={onPress}
    style={{
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderBottomWidth: last ? 0 : StyleSheet.hairlineWidth,
      borderBottomColor: t.divider,
    }}
  >
    <View
      style={{
        width: 34,
        height: 34,
        borderRadius: 9,
        backgroundColor: color + '22',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {iconNode ?? (icon ? <Icon name={icon} size={17} color={color} /> : null)}
    </View>
    <Text style={{ flex: 1, fontSize: 14.5, color: t.text, fontWeight: '500' }}>{label}</Text>
    {detail ? <Text style={{ fontSize: 13, color: t.textSec }}>{detail}</Text> : null}
    <Icon name="chevron-right" size={15} color={t.textTer} />
  </Pressable>
);
