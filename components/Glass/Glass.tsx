import React, { useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, Modal, Pressable, StyleSheet } from 'react-native';
import { KeyboardProvider } from 'react-native-keyboard-controller';

// ModalBackdrop owns the full modal lifecycle: it mounts the RN Modal, animates
// the dim and the content independently, and unmounts after the exit animation
// completes so nothing trails the sheet sliding down.
//
// Dim: fades in only after the sheet has slid most of the way up, and fades out
// before the sheet starts sliding down — it never translates, never trails.
//
// Content (default, bottom-sheet): translateY from screen-bottom → 0.
// Content (center, date-picker): opacity fade, no slide.
type ModalBackdropProps = {
  visible: boolean;
  onClose: () => void;
  center?: boolean;
  children?: React.ReactNode;
};

export const ModalBackdrop = ({
  visible,
  onClose,
  center = false,
  children,
}: React.PropsWithChildren<ModalBackdropProps>) => {
  const [mounted, setMounted] = useState<boolean>(false);
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setMounted(true);
      Animated.timing(progress, {
        toValue: 1,
        duration: 320,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(progress, {
        toValue: 0,
        duration: 240,
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) setMounted(false);
      });
    }
  }, [visible, progress]);

  if (!mounted) return null;

  const screenHeight = Dimensions.get('window').height;

  // Dim appears only in the back half of the open and disappears in the front
  // half of the close — so it never visually trails the sliding sheet.
  const dimOpacity = progress.interpolate({
    inputRange: [0, 0.55, 1],
    outputRange: [0, 0, 0.5],
  });

  // Content animation: slide for bottom sheets, fade for centered dialogs.
  const contentAnim = center
    ? { opacity: progress }
    : {
        transform: [
          {
            translateY: progress.interpolate({
              inputRange: [0, 1],
              outputRange: [screenHeight, 0],
            }),
          },
        ],
      };

  return (
    <Modal transparent visible animationType="none" statusBarTranslucent onRequestClose={onClose}>
      <KeyboardProvider statusBarTranslucent navigationBarTranslucent>
        {/* Dim sits as a sibling of the content wrapper so it is never inside
            the translated view and therefore never moves with the sheet. */}
        <Animated.View
          pointerEvents="none"
          style={[StyleSheet.absoluteFill, { backgroundColor: '#000', opacity: dimOpacity }]}
        />
        <Animated.View style={[{ flex: 1 }, contentAnim]}>
          <Pressable
            onPress={onClose}
            style={{
              flex: 1,
              justifyContent: center ? 'center' : 'flex-end',
              alignItems: center ? 'center' : undefined,
              padding: center ? 20 : 0,
            }}
          >
            {children}
          </Pressable>
        </Animated.View>
      </KeyboardProvider>
    </Modal>
  );
};
