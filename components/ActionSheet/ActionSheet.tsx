import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { Tokens } from '@/lib/tokens';
import { ModalBackdrop } from '@/components/Glass';

export type ActionSheetOption = {
  label: string;
  destructive?: boolean;
  onPress: () => void;
};

export type ActionSheetConfig = {
  title?: string;
  options: ActionSheetOption[];
};

// A clean iOS-style bottom action sheet used on Android in place of the ugly
// default Alert.alert button stack. iOS keeps the native ActionSheetIOS.
export const ActionSheet = ({ t, config, cancelLabel, onClose }: { t: Tokens; config: ActionSheetConfig | null; cancelLabel: string; onClose: () => void }) => (
  <ModalBackdrop visible={!!config} onClose={onClose}>
    <Pressable onPress={() => {}} style={{ padding: 14, paddingBottom: 34 }}>
      <View
        style={{
          backgroundColor: t.sheetBg,
          borderRadius: 20,
          overflow: 'hidden',
          marginBottom: 10,
        }}
      >
        {config?.title ? (
          <View
            style={{
              paddingVertical: 14,
              paddingHorizontal: 18,
              borderBottomWidth: StyleSheet.hairlineWidth,
              borderBottomColor: t.divider,
            }}
          >
            <Text
              style={{ fontSize: 13, color: t.textSec, fontWeight: '600', textAlign: 'center' }}
            >
              {config.title}
            </Text>
          </View>
        ) : null}
        {config?.options.map((o, i) => (
          <Pressable
            key={i}
            onPress={() => {
              onClose();
              o.onPress();
            }}
            style={({ pressed }) => ({
              paddingVertical: 16,
              paddingHorizontal: 18,
              borderTopWidth: i === 0 && !config?.title ? 0 : StyleSheet.hairlineWidth,
              borderTopColor: t.divider,
              backgroundColor: pressed ? t.surfaceAlt : 'transparent',
            })}
          >
            <Text
              style={{
                fontSize: 16,
                fontWeight: '600',
                color: o.destructive ? t.expense : t.text,
                textAlign: 'center',
              }}
            >
              {o.label}
            </Text>
          </Pressable>
        ))}
      </View>
      <Pressable
        onPress={onClose}
        style={({ pressed }) => ({
          backgroundColor: t.sheetBg,
          borderRadius: 20,
          paddingVertical: 16,
          alignItems: 'center',
          opacity: pressed ? 0.7 : 1,
        })}
      >
        <Text style={{ fontSize: 16, fontWeight: '700', color: t.text }}>{cancelLabel}</Text>
      </Pressable>
    </Pressable>
  </ModalBackdrop>
);
