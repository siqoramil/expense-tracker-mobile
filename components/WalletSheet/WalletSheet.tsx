import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { KeyboardAwareScrollView, KeyboardStickyView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { Tokens } from '@/lib/tokens';
import { Icon, type IconName } from '@/components/Icon';
import { ModalBackdrop } from '@/components/Glass';
import { Button, Field, Input } from '@/components/ui';
import { actions, type Wallet } from '@/lib/store';
import { tStr, type Lang } from '@/lib/i18n';

const ICON_OPTIONS: IconName[] = [
  'wallet',
  'credit-card',
  'briefcase',
  'gift',
  'home-icon',
  'cart',
  'phone',
  'coffee',
];

const COLOR_OPTIONS: string[] = [
  '#10B981',
  '#6366F1',
  '#F59E0B',
  '#EF4444',
  '#3B82F6',
  '#EC4899',
  '#8B5CF6',
  '#06B6D4',
];

type Props = {
  t: Tokens;
  lang: Lang;
  visible: boolean;
  wallet?: Wallet;
  onClose: () => void;
};

export const WalletSheet: React.FC<Props> = ({ t, lang, visible, wallet, onClose }) => {
  const isEdit = wallet !== undefined;
  const insets = useSafeAreaInsets();
  // Footer height = paddingTop(12) + button(52) + paddingBottom + opened offset(16).
  // bottomOffset must match so KeyboardAwareScrollView scrolls the focused input
  // above the sticky footer, not just above the keyboard.
  const footerPaddingBottom = Math.max(insets.bottom, 16);
  const stickyFooterOffset = 12 + 52 + footerPaddingBottom + 16;

  const [name, setName] = useState<string>('');
  const [icon, setIcon] = useState<IconName>('wallet');
  const [color, setColor] = useState(COLOR_OPTIONS[0]);
  const [balance, setBalance] = useState<string>('');

  useEffect(() => {
    if (visible) {
      if (wallet) {
        setName(wallet.name.en ?? '');
        setIcon((wallet.icon as IconName) ?? 'wallet');
        setColor(wallet.color ?? COLOR_OPTIONS[0]);
        setBalance('');
      } else {
        setName('');
        setIcon('wallet');
        setColor(COLOR_OPTIONS[0]);
        setBalance('');
      }
    }
  }, [visible, wallet]);

  const handleSave = () => {
    const trimmed = name.trim();
    if (!trimmed) return;

    if (isEdit) {
      actions.updateWallet(wallet.id, {
        name: { en: trimmed, uz: trimmed },
        icon,
        color,
      });
    } else {
      const parsed = parseFloat(balance.replace(',', '.'));
      actions.addWallet({
        name: { en: trimmed, uz: trimmed },
        icon,
        color,
        balance: isNaN(parsed) ? 0 : parsed,
      });
    }
    onClose();
  };

  return (
    <ModalBackdrop visible={visible} onClose={onClose}>
      <Pressable
        onPress={() => {}}
        style={{
          backgroundColor: t.sheetBg,
          borderTopLeftRadius: 28,
          borderTopRightRadius: 28,
          paddingHorizontal: 22,
          paddingTop: 12,
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
                <Text
                  style={{ fontSize: 20, fontWeight: '700', color: t.text, letterSpacing: -0.4 }}
                >
                  {tStr(lang, isEdit ? 'editWallet' : 'addWallet')}
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
                extraKeyboardSpace={stickyFooterOffset}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 8 }}
              >
                <Field t={t} label={tStr(lang, 'name')}>
                  <Input
                    t={t}
                    value={name}
                    onChangeText={setName}
                    autoFocus={!isEdit}
                    placeholder={tStr(lang, 'wallet')}
                    maxLength={60}
                  />
                </Field>

                <Field t={t} label={tStr(lang, 'icon')} style={{ marginTop: 18 }}>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ gap: 10, paddingVertical: 4 }}
                  >
                    {ICON_OPTIONS.map((ic) => (
                      <Pressable
                        key={ic}
                        onPress={() => setIcon(ic)}
                        style={{
                          width: 48,
                          height: 48,
                          borderRadius: 14,
                          backgroundColor: icon === ic ? color + '33' : t.surfaceAlt,
                          borderWidth: icon === ic ? 2 : StyleSheet.hairlineWidth,
                          borderColor: icon === ic ? color : t.border,
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Icon name={ic} size={22} color={icon === ic ? color : t.textSec} />
                      </Pressable>
                    ))}
                  </ScrollView>
                </Field>

                <Field t={t} label={tStr(lang, 'color')} style={{ marginTop: 18 }}>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                  {COLOR_OPTIONS.map((c) => (
                    <Pressable
                      key={c}
                      onPress={() => setColor(c)}
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 18,
                        backgroundColor: c,
                        borderWidth: color === c ? 3 : 0,
                        borderColor: t.text,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {color === c ? (
                        <Icon name="check" size={16} color="#fff" stroke={2.5} />
                      ) : null}
                    </Pressable>
                  ))}
                </View>
                </Field>

                {!isEdit ? (
                  <Field t={t} label={tStr(lang, 'startingBalance')} style={{ marginTop: 18 }}>
                    <Input
                      t={t}
                      value={balance}
                      onChangeText={setBalance}
                      keyboardType="decimal-pad"
                      placeholder="0"
                      maxLength={16}
                    />
                  </Field>
                ) : null}
              </KeyboardAwareScrollView>
              <KeyboardStickyView
                offset={{ opened: 16 }}
                style={{
                  paddingTop: 12,
                  paddingBottom: footerPaddingBottom,
                  borderTopWidth: StyleSheet.hairlineWidth,
                  borderTopColor: t.border,
                  backgroundColor: t.sheetBg,
                }}
              >
                <Button t={t} label={tStr(lang, 'save')} onPress={handleSave} />
              </KeyboardStickyView>
      </Pressable>
    </ModalBackdrop>
  );
};
