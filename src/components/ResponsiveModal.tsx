import React, { useEffect, useRef } from 'react';
import {
  Modal,
  View,
  StyleSheet,
  Pressable,
  Animated,
  Platform,
  KeyboardAvoidingView,
  ViewStyle,
} from 'react-native';
import { colors, glass, radius, shadows, spacing } from '../utils/theme';
import { useResponsive } from '../hooks/useResponsive';

type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';

interface ResponsiveModalProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  size?: ModalSize;
  /** Set to true for modals that need more height (e.g., with long forms) */
  allowFullHeight?: boolean;
  /** Custom max height as percentage of viewport (0-100), only applies on desktop */
  maxHeightPercent?: number;
  style?: ViewStyle;
}

const MODAL_SIZES: Record<ModalSize, number> = {
  sm: 400,
  md: 480,
  lg: 560,
  xl: 640,
  full: 900,
};

/**
 * ResponsiveModal - A modal wrapper that adapts to platform and screen size
 *
 * - Mobile: Full-screen slide-up modal (native feel)
 * - Desktop/Web: Centered dialog with backdrop overlay
 */
const ResponsiveModal: React.FC<ResponsiveModalProps> = ({
  visible,
  onClose,
  children,
  size = 'lg',
  allowFullHeight = false,
  maxHeightPercent = 85,
  style,
}) => {
  const { isWeb, isDesktop, isTablet, height } = useResponsive();
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const modalScale = useRef(new Animated.Value(0.95)).current;
  const modalOpacity = useRef(new Animated.Value(0)).current;

  const showDesktopStyle = isWeb && (isDesktop || isTablet);

  // Animate in/out on web
  useEffect(() => {
    if (!showDesktopStyle) return;

    if (visible) {
      Animated.parallel([
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(modalScale, {
          toValue: 1,
          damping: 20,
          stiffness: 300,
          useNativeDriver: true,
        }),
        Animated.timing(modalOpacity, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      backdropOpacity.setValue(0);
      modalScale.setValue(0.95);
      modalOpacity.setValue(0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, showDesktopStyle]);

  // Handle Escape key on web
  useEffect(() => {
    if (!isWeb || !visible) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isWeb, visible, onClose]);

  // Desktop/Web: Centered dialog with backdrop
  if (showDesktopStyle) {
    const maxWidth = MODAL_SIZES[size];
    const maxHeight = allowFullHeight ? height - 48 : (height * maxHeightPercent) / 100;

    return (
      <Modal
        visible={visible}
        transparent
        animationType="none"
        onRequestClose={onClose}
      >
        <View style={styles.desktopContainer}>
          {/* Backdrop */}
          <Animated.View
            style={[
              styles.backdrop,
              { opacity: backdropOpacity },
            ]}
          >
            <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
          </Animated.View>

          {/* Modal Card */}
          <Animated.View
            style={[
              styles.desktopModal,
              {
                maxWidth,
                maxHeight,
                transform: [{ scale: modalScale }],
                opacity: modalOpacity,
              },
              style,
            ]}
          >
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : undefined}
              style={styles.keyboardView}
            >
              {children}
            </KeyboardAvoidingView>
          </Animated.View>
        </View>
      </Modal>
    );
  }

  // Mobile: Native slide-up modal
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.mobileContainer}
      >
        {children}
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  // Mobile styles
  mobileContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },

  // Desktop styles
  desktopContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing['3xl'],
  },

  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },

  desktopModal: {
    width: '100%',
    backgroundColor: colors.background,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: glass.border,
    overflow: 'hidden',
    ...shadows.xl,
  },

  keyboardView: {
    flex: 1,
  },
});

export default ResponsiveModal;
