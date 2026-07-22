import React from 'react';
import { Dimensions, Pressable, ScrollView, Text, View } from 'react-native';
import { KeyboardStickyView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { Tokens } from '@/lib/tokens';
import { Icon } from '@/components/Icon';
import { ModalBackdrop } from '@/components/Glass';
import { errorMessage } from '@/lib/errors';
import { type Lang } from '@/lib/i18n';

export type SheetProps = { t: Tokens; visible: boolean; onClose: () => void };

export const extractError = (e: unknown, lang: Lang): string => errorMessage(lang, e);

export const SheetContainer = ({
  t,
  visible,
  onClose,
  title,
  children,
  footer,
}: React.PropsWithChildren<{
  t: Tokens;
  visible: boolean;
  onClose: () => void;
  title: string;
  footer?: React.ReactNode;
}>) => {
  const insets = useSafeAreaInsets();
  const sheetPaddingBottom = Math.max(insets.bottom, 16);
  // Numeric cap, not '90%': the sheet is wrapped in KeyboardStickyView (auto height),
  // so a percentage maxHeight has no basis to resolve against and collapses the
  // content. A concrete value lets short forms size to content and tall ones scroll.
  const maxSheetHeight = Dimensions.get('window').height * 0.9;
  return (
    <ModalBackdrop visible={visible} onClose={onClose}>
      {/* The whole sheet rides the keyboard as one compact unit, so the CTA
          stays directly under the content instead of leaving a big gap. */}
      <KeyboardStickyView offset={{ closed: 0, opened: sheetPaddingBottom }}>
        <Pressable
          onPress={() => {}}
          style={{
            backgroundColor: t.sheetBg,
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            paddingHorizontal: 22,
            paddingTop: 12,
            paddingBottom: sheetPaddingBottom,
            maxHeight: maxSheetHeight,
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
          {/* flexShrink lets the content scroll only if it would overflow the
              sheet's maxHeight; otherwise the sheet hugs its content. */}
          {/* footer lives INSIDE the ScrollView so its CTA is a child of the
              keyboardShouldPersistTaps="handled" tree — tapping Save while the
              keyboard is open fires on the first tap (it neither dismisses the
              keyboard nor lets the sticky view shift the button out from under
              the finger). */}
          <ScrollView
            bounces={false}
            keyboardShouldPersistTaps="always"
            showsVerticalScrollIndicator={false}
            style={{ flexGrow: 0, flexShrink: 1 }}
          >
            {children}
            {footer ? <View style={{ marginTop: 20 }}>{footer}</View> : null}
          </ScrollView>
        </Pressable>
      </KeyboardStickyView>
    </ModalBackdrop>
  );
};
