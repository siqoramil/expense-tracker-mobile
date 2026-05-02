import React, { useState } from 'react';
import { ActionSheetIOS, Alert, Image, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

type ImagePickerModule = typeof import('expo-image-picker');
const loadImagePicker = (): ImagePickerModule | null => {
  try {
    return require('expo-image-picker') as ImagePickerModule;
  } catch {
    return null;
  }
};
import { tStr } from '../../lib/i18n';
import { actions, isImageAvatar, store, useStore } from '../../lib/store';
import { toast } from '../../lib/toast';
import type { Tokens } from '../../lib/tokens';
import { EditEmailSheet, EditNameSheet } from '../AccountSheets';
import { Icon, type IconName } from '../Icon';
import { Card, ScreenHeader, SectionHeader, Switch } from '../ui';

type Nav = (screen: string, data?: unknown) => void;

export const ProfileScreen: React.FC<{ t: Tokens; onNav: Nav; onLogout: () => void }> = ({
  t,
  onNav,
  onLogout,
}) => {
  const s = useStore();
  const lang = s.prefs.lang;
  const [editName, setEditName] = useState(false);
  const [editEmail, setEditEmail] = useState(false);

  const hasImage = isImageAvatar(s.profile.avatar);

  const pickImage = async () => {
    const ImagePicker = loadImagePicker();
    if (!ImagePicker) {
      toast(
        lang === 'uz'
          ? "Rasm tanlash mavjud emas — ilovani qayta build qiling"
          : 'Image picker unavailable — rebuild the dev client',
      );
      return;
    }
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (perm.status !== 'granted') {
        toast(lang === 'uz' ? "Ruxsat berilmagan" : 'Permission denied');
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
      await actions.updateAvatar(uri);
      toast(tStr(lang, 'saved'));
    } catch (err) {
      const msg = err instanceof Error ? err.message : '';
      console.warn('avatar upload failed:', msg);
      toast(
        lang === 'uz'
          ? `Xatolik: ${msg || 'noma\'lum'}`
          : `Error: ${msg || 'unknown'}`,
      );
    }
  };

  const openAvatarMenu = () => {
    if (!hasImage) {
      void pickImage();
      return;
    }
    const labels = {
      title: lang === 'uz' ? 'Profil rasmi' : 'Profile photo',
      library: lang === 'uz' ? 'Galereyadan tanlash' : 'Choose from library',
      remove: lang === 'uz' ? "Rasmni o'chirish" : 'Remove photo',
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
      const buttons = options.slice(0, -1).map((label, i) => ({
        text: label,
        style: (i === destructiveIdx ? 'destructive' : 'default') as 'destructive' | 'default',
        onPress: () => handle(i),
      }));
      Alert.alert(labels.title, undefined, [
        ...buttons,
        { text: labels.cancel, style: 'cancel' },
      ]);
    }
  };

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 160 }}>
      <ScreenHeader t={t} title={tStr(lang, 'profile')} />

      <View style={{ paddingHorizontal: 20, paddingBottom: 18 }}>
        <Card t={t} style={{ padding: 20, flexDirection: 'row', alignItems: 'center', gap: 14 }}>
          <Pressable
            onPress={openAvatarMenu}
            style={{
              width: 60,
              height: 60,
              borderRadius: 30,
              backgroundColor: t.accent,
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              shadowColor: t.accent,
              shadowOpacity: 0.25,
              shadowRadius: 14,
              shadowOffset: { width: 0, height: 4 },
              elevation: 4,
            }}
          >
            {hasImage ? (
              <Image source={{ uri: s.profile.avatar }} style={{ width: 60, height: 60 }} />
            ) : (
              <Text style={{ fontSize: 20, fontWeight: '700', color: '#fff' }}>
                {s.profile.avatar}
              </Text>
            )}
            <View
              style={{
                position: 'absolute',
                right: 0,
                bottom: 0,
                width: 22,
                height: 22,
                borderRadius: 11,
                backgroundColor: t.surface,
                borderWidth: 2,
                borderColor: t.bg,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Icon name="pen" size={11} color={t.textSec} stroke={2.4} />
            </View>
          </Pressable>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Pressable
              onPress={() => setEditName(true)}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
            >
              <Text
                style={{ fontSize: 17, fontWeight: '700', color: t.text, letterSpacing: -0.3 }}
                numberOfLines={1}
              >
                {s.profile.name}
              </Text>
              <Icon name="settings" size={14} color={t.textTer} stroke={2} />
            </Pressable>
            <Pressable
              onPress={() => setEditEmail(true)}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}
            >
              <Text
                style={{ fontSize: 12.5, color: t.textSec }}
                numberOfLines={1}
              >
                {s.profile.email}
              </Text>
              <Icon name="settings" size={11} color={t.textTer} stroke={2} />
            </Pressable>
            <View
              style={{
                flexDirection: 'row',
                alignSelf: 'flex-start',
                alignItems: 'center',
                gap: 4,
                marginTop: 7,
                paddingVertical: 2,
                paddingHorizontal: 7,
                borderRadius: 5,
                backgroundColor: t.accentSoft,
              }}
            >
              <Icon name="check" size={10} color={t.accent} stroke={3} />
              <Text style={{ color: t.accent, fontSize: 10.5, fontWeight: '600' }}>
                {tStr(lang, 'pro')}
              </Text>
            </View>
          </View>
        </Card>
      </View>

      <EditNameSheet t={t} visible={editName} onClose={() => setEditName(false)} />
      <EditEmailSheet t={t} visible={editEmail} onClose={() => setEditEmail(false)} />

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
            detail={lang === 'en' ? 'English' : 'O‘zbekcha'}
            onPress={() => onNav('language')}
          />
          <NavRow
            t={t}
            icon="credit-card"
            color="#10B981"
            label={tStr(lang, 'currency')}
            detail={s.prefs.currency}
            onPress={() => onNav('currency')}
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
          <NavRow t={t} icon="wallet" color="#EC4899" label={tStr(lang, 'wallets')} onPress={() => onNav('wallets')} />
          <NavRow t={t} icon="chart" color="#10B981" label={tStr(lang, 'budgets')} onPress={() => onNav('budgets')} />
          <NavRow
            t={t}
            icon="calendar"
            color="#3B82F6"
            label={lang === 'uz' ? 'Takrorlanuvchi' : 'Recurring'}
            onPress={() => onNav('recurring')}
          />
          <NavRow t={t} icon="calendar" color="#F97316" label={tStr(lang, 'calendar')} onPress={() => onNav('calendar')} />
          <NavRow t={t} icon="bell" color="#EC4899" label={tStr(lang, 'notifications')} onPress={() => onNav('notifications')} />
          <NavRow t={t} icon="lock" color="#8B5CF6" label={tStr(lang, 'security')} onPress={() => onNav('security')} />
          <NavRow t={t} icon="download" color="#0EA5E9" label={tStr(lang, 'reports')} onPress={() => onNav('reports')} last />
        </Card>
      </View>

      <View style={{ paddingHorizontal: 20, paddingBottom: 16 }}>
        <Card t={t}>
          <NavRow
            t={t}
            icon="settings"
            color="#71717A"
            label={tStr(lang, 'resetData')}
            onPress={() => {
              Alert.alert(tStr(lang, 'resetData') + '?', '', [
                { text: tStr(lang, 'cancel'), style: 'cancel' },
                {
                  text: tStr(lang, 'delete'),
                  style: 'destructive',
                  onPress: () => {
                    store.reset();
                    toast('Reset');
                  },
                },
              ]);
            }}
          />
          <NavRow t={t} icon="arrow-up-right" color={t.expense} label={tStr(lang, 'signOut')} onPress={onLogout} last />
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

export const ToggleRow: React.FC<{
  t: Tokens;
  icon: IconName;
  color: string;
  label: string;
  on: boolean;
  onChange: (v: boolean) => void;
  last?: boolean;
}> = ({ t, icon, color, label, on, onChange, last }) => (
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

export const NavRow: React.FC<{
  t: Tokens;
  icon: IconName;
  color: string;
  label: string;
  detail?: string;
  onPress: () => void;
  last?: boolean;
}> = ({ t, icon, color, label, detail, onPress, last }) => (
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
      <Icon name={icon} size={17} color={color} />
    </View>
    <Text style={{ flex: 1, fontSize: 14.5, color: t.text, fontWeight: '500' }}>{label}</Text>
    {detail ? <Text style={{ fontSize: 13, color: t.textSec }}>{detail}</Text> : null}
    <Icon name="chevron-right" size={15} color={t.textTer} />
  </Pressable>
);
