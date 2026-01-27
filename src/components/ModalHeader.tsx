import React, { useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Pressable,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { colors, glass, radius, spacing, typography, shadows } from '../utils/theme';
import { lightHaptic } from '../utils/haptics';

interface ModalHeaderProps {
  title: string;
  onCancel: () => void;
  onSave?: () => void;
  saveText?: string;
  cancelText?: string;
  saveDisabled?: boolean;
  rightAccessory?: React.ReactNode;
  showSave?: boolean;
}

const ModalHeader: React.FC<ModalHeaderProps> = ({
  title,
  onCancel,
  onSave,
  saveText = 'Save',
  cancelText = 'Cancel',
  saveDisabled = false,
  rightAccessory,
  showSave = true,
}) => {
  const insets = useSafeAreaInsets();
  const shouldShowSave = showSave && onSave;

  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top, spacing.md) }]}>
      {/* Blur background for iOS, solid for others */}
      {Platform.OS === 'ios' ? (
        <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill} pointerEvents="none">
          <View style={styles.blurOverlay} />
        </BlurView>
      ) : (
        <View style={styles.solidBackground} pointerEvents="none" />
      )}

      {/* Bottom gradient fade */}
      <LinearGradient
        colors={['transparent', colors.background]}
        style={styles.bottomFade}
        pointerEvents="none"
      />

      <View style={styles.content}>
        {/* Cancel Button */}
        <HeaderButton
          label={cancelText}
          onPress={onCancel}
          variant="ghost"
        />

        {/* Title */}
        <View style={styles.titleContainer}>
          <Text style={styles.title} numberOfLines={1}>{title}</Text>
        </View>

        {/* Right side: accessory + save */}
        <View style={styles.rightSection}>
          {rightAccessory}
          {shouldShowSave && onSave && (
            <HeaderButton
              label={saveText}
              onPress={onSave}
              variant="primary"
              disabled={saveDisabled}
            />
          )}
          {!shouldShowSave && <View style={styles.placeholder} />}
        </View>
      </View>

      {/* Accent line */}
      <View style={styles.accentLine} />
    </View>
  );
};

interface HeaderButtonProps {
  label: string;
  onPress: () => void;
  variant: 'primary' | 'ghost';
  disabled?: boolean;
}

const HeaderButton: React.FC<HeaderButtonProps> = ({
  label,
  onPress,
  variant,
  disabled = false,
}) => {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: 0.95,
      useNativeDriver: true,
      damping: 15,
      stiffness: 300,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      damping: 15,
      stiffness: 300,
    }).start();
  };

  const handlePress = () => {
    if (disabled) return;
    lightHaptic();
    onPress();
  };

  const isPrimary = variant === 'primary';

  return (
    <Pressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
    >
      <Animated.View style={{ transform: [{ scale }] }}>
        {isPrimary ? (
          <LinearGradient
            colors={disabled
              ? [glass.background, glass.backgroundDark]
              : [colors.primary, colors.primaryHover]
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.button, styles.primaryButton]}
          >
            <Text style={[
              styles.buttonText,
              styles.primaryText,
              disabled && styles.disabledText,
            ]}>
              {label}
            </Text>
          </LinearGradient>
        ) : (
          <View style={[styles.button, styles.ghostButton]}>
            <Text style={[styles.buttonText, styles.ghostText]}>
              {label}
            </Text>
          </View>
        )}
      </Animated.View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    borderBottomWidth: 0,
    overflow: 'hidden',
  },
  blurOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: glass.backgroundDark,
  },
  solidBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.surface,
  },
  bottomFade: {
    position: 'absolute',
    bottom: -20,
    left: 0,
    right: 0,
    height: 20,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
  },
  title: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.semibold,
    color: colors.text,
    letterSpacing: 0.2,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  button: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.full,
    minWidth: 70,
    alignItems: 'center',
  },
  primaryButton: {
    ...shadows.sm,
  },
  ghostButton: {
    backgroundColor: glass.backgroundLight,
    borderWidth: 1,
    borderColor: glass.border,
  },
  buttonText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
    letterSpacing: 0.2,
  },
  primaryText: {
    color: colors.text,
  },
  ghostText: {
    color: colors.textSecondary,
  },
  disabledText: {
    color: colors.textMuted,
  },
  accentLine: {
    height: 1,
    backgroundColor: glass.border,
  },
  placeholder: {
    width: 70,
  },
});

export default ModalHeader;
