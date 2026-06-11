import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { fmtMoney, unitOf, type Currency } from '../../lib/format';
import { tStr } from '../../lib/i18n';
import { actions, useStore, walletName, type Wallet } from '../../lib/store';
import type { Tokens } from '../../lib/tokens';
import { Icon, type IconName } from '../Icon';
import { WalletSheet } from '../WalletSheet';

const ActiveCard: React.FC<{
  w: Wallet;
  currency: Currency;
  langName: string;
  onPress: () => void;
  onHide: () => void;
}> = ({ w, currency, langName, onPress, onHide }) => (
  <Pressable
    onPress={onPress}
    style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
  >
    <View
      style={{
        padding: 18,
        backgroundColor: w.color,
        borderRadius: 20,
        overflow: 'hidden',
      }}
    >
      <View
        style={{
          position: 'absolute',
          top: -20,
          right: -20,
          width: 100,
          height: 100,
          borderRadius: 50,
          backgroundColor: 'rgba(255,255,255,0.15)',
        }}
      />
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
          marginBottom: 14,
        }}
      >
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            backgroundColor: 'rgba(255,255,255,0.25)',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon name={w.icon as IconName} size={18} color="#fff" />
        </View>
        <Text style={{ flex: 1, fontSize: 14, fontWeight: '600', color: '#fff' }}>{langName}</Text>
        <Pressable
          onPress={onHide}
          hitSlop={10}
          style={{
            width: 28,
            height: 28,
            borderRadius: 14,
            backgroundColor: 'rgba(0,0,0,0.18)',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon name="close" size={14} color="#fff" stroke={2.5} />
        </Pressable>
      </View>
      <Text style={{ fontSize: 24, fontWeight: '700', color: '#fff', letterSpacing: -0.8 }}>
        {fmtMoney(w.balance, currency)}
      </Text>
      <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 2 }}>
        {unitOf(currency) || currency}
      </Text>
    </View>
  </Pressable>
);

const HiddenRow: React.FC<{
  t: Tokens;
  w: Wallet;
  langName: string;
  isLast: boolean;
  onRestore: () => void;
}> = ({ t, w, langName, isLast, onRestore }) => (
  <Pressable
    onPress={onRestore}
    style={({ pressed }) => [
      {
        paddingVertical: 12,
        paddingHorizontal: 14,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        borderBottomWidth: isLast ? 0 : StyleSheet.hairlineWidth,
        borderBottomColor: t.divider,
        opacity: pressed ? 0.6 : 1,
      },
    ]}
  >
    <View
      style={{
        width: 34,
        height: 34,
        borderRadius: 9,
        backgroundColor: w.color + '22',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Icon name={w.icon as IconName} size={16} color={w.color} />
    </View>
    <Text
      style={{
        flex: 1,
        fontSize: 14.5,
        fontWeight: '500',
        color: t.textSec,
      }}
    >
      {langName}
    </Text>
    <View
      style={{
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: t.accent + '22',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Icon name="plus" size={16} color={t.accent} />
    </View>
  </Pressable>
);

export const WalletsScreen: React.FC<{ t: Tokens }> = ({ t }) => {
  const s = useStore();
  const lang = s.prefs.lang;
  const active = s.wallets.filter((w) => !w.hidden);
  const hidden = s.wallets.filter((w) => w.hidden);
  const total = active.reduce((a, w) => a + w.balance, 0);

  const [sheetVisible, setSheetVisible] = useState(false);
  const [editingWallet, setEditingWallet] = useState<Wallet | undefined>(undefined);

  const openAdd = () => {
    setEditingWallet(undefined);
    setSheetVisible(true);
  };

  const openEdit = (w: Wallet) => {
    setEditingWallet(w);
    setSheetVisible(true);
  };

  const closeSheet = () => {
    setSheetVisible(false);
    setEditingWallet(undefined);
  };

  const confirmDelete = (w: Wallet) => {
    const name = walletName(w, lang);
    Alert.alert(
      tStr(lang, 'deleteWallet'),
      tStr(lang, 'deleteWalletConfirm'),
      [
        { text: tStr(lang, 'cancel'), style: 'cancel' },
        {
          text: tStr(lang, 'delete'),
          style: 'destructive',
          onPress: () => actions.deleteWallet(w.id),
        },
      ],
      { cancelable: true },
    );
    void name;
  };

  return (
    <>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        <Text
          style={{
            fontSize: 13,
            color: t.textSec,
            paddingHorizontal: 20,
            paddingTop: 12,
            paddingBottom: 4,
          }}
        >
          {`${fmtMoney(total, s.prefs.currency)} ${unitOf(s.prefs.currency)}`.trim()}
        </Text>
        <View style={{ paddingHorizontal: 20, gap: 10 }}>
          {active.map((w) => (
            <ActiveCard
              key={w.id}
              w={w}
              currency={s.prefs.currency}
              langName={walletName(w, lang)}
              onPress={() => openEdit(w)}
              onHide={() => confirmDelete(w)}
            />
          ))}

          {hidden.length > 0 ? (
            <View style={{ marginTop: 14 }}>
              <Text
                style={{
                  fontSize: 11,
                  color: t.textTer,
                  fontWeight: '600',
                  marginBottom: 6,
                  letterSpacing: 0.3,
                  textTransform: 'uppercase',
                }}
              >
                {tStr(lang, 'disabled')}
              </Text>
              <View
                style={{
                  backgroundColor: t.surface,
                  borderRadius: 16,
                  borderWidth: StyleSheet.hairlineWidth,
                  borderColor: t.border,
                  paddingHorizontal: 4,
                }}
              >
                {hidden.map((w, i) => (
                  <HiddenRow
                    key={w.id}
                    t={t}
                    w={w}
                    langName={walletName(w, lang)}
                    isLast={i === hidden.length - 1}
                    onRestore={() => actions.setWalletHidden(w.id, false)}
                  />
                ))}
              </View>
            </View>
          ) : null}

          <Pressable
            onPress={openAdd}
            style={({ pressed }) => ({
              marginTop: 6,
              height: 52,
              borderRadius: 16,
              borderWidth: StyleSheet.hairlineWidth,
              borderColor: t.border,
              borderStyle: 'dashed',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'row',
              gap: 8,
              opacity: pressed ? 0.6 : 1,
            })}
          >
            <Icon name="plus" size={18} color={t.textSec} />
            <Text style={{ fontSize: 14, fontWeight: '600', color: t.textSec }}>
              {tStr(lang, 'addWallet')}
            </Text>
          </Pressable>
        </View>
      </ScrollView>

      <WalletSheet
        t={t}
        lang={lang}
        visible={sheetVisible}
        wallet={editingWallet}
        onClose={closeSheet}
      />
    </>
  );
};
