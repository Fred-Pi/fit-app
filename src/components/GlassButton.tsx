import React, { useRef } from 'react';
import {
  Text,
  StyleSheet,
  Animated,
  Pressable,
  ViewStyle,
  TextStyle,
  View,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, glass, radius, typography, spacing, shadows } from '../utils/theme';
import { lightHaptic } from '../utils/haptics';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';
type ButtonSize = 'sm' | 'md' | 'lg';

interface GlassButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: keyof typeof Ionicons.glyphMap;
  iconPosition?: 'left' | 'right';
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  haptic?: boolean;
  tintColor?: string;
}

const variantConfig: Record<ButtonVariant, {
  gradient: string[];
  textColor: string;
  borderColor: string;
  glowColor?: string;
}> = {
  primary: {
    gradient: [colors.primary, colors.primaryHover],
    textColor: colors.text,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    glowColor: glass.glow.blue,
  },
  secondary: {
    gradient: [glass.backgroundLight, glass.background],
    textColor: colors.text,
    borderColor: glass.borderLight,
  },
  ghost: {
    gradient: ['transparent', 'transparent'],
    textColor: colors.primary,
    borderColor: colors.primary,
  },
  danger: {
    gradient: [colors.error, colors.errorMuted],
    textColor: colors.text,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    glowColor: 'rgba(239, 68, 68, 0.3)',
  },
  success: {
    gradient: [colors.success, colors.successMuted],
    textColor: colors.text,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    glowColor: glass.glow.emerald,
  },
};

const sizeConfig: Record<ButtonSize, {
  paddingVertical: number;
  paddingHorizontal: number;
  fontSize: number;
  iconSize: number;
  borderRadius: number;
}> = {
  sm: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    fontSize: typography.size.sm,
    iconSize: 16,
    borderRadius: radius.md,
  },
  md: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    fontSize: typography.size.base,
    iconSize: 20,
    borderRadius: radius.lg,
  },
  lg: {
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    fontSize: typography.size.lg,
    iconSize: 24,
    borderRadius: radius.xl,
  },
};

const GlassButton: React.FC<GlassButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  icon,
  iconPosition = 'left',
  disabled = false,
  loading = false,
  fullWidth = false,
  style,
  textStyle,
  haptic = true,
  tintColor,
}) => {
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(1)).current;
  const hoverAnim = useRef(new Animated.Value(0)).current;

  const config = variantConfig[variant];
  const sizeStyles = sizeConfig[size];

  // Apply tint color to gradient if provided (works best with secondary variant)
  const gradientColors = tintColor && !disabled
    ? [`${tintColor}15`, `${tintColor}08`]
    : config.gradient;

  const glowColor = tintColor && !disabled
    ? `${tintColor}30`
    : config.glowColor;

  const handlePressIn = () => {
    Animated.parallel([
      Animated.spring(scale, {
        toValue: 0.96,
        useNativeDriver: true,
        damping: 15,
        stiffness: 300,
      }),
      Animated.timing(opacity, {
        toValue: 0.9,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handlePressOut = () => {
    Animated.parallel([
      Animated.spring(scale, {
        toValue: 1,
        useNativeDriver: true,
        damping: 15,
        stiffness: 300,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handlePress = () => {
    if (disabled || loading) return;
    if (haptic) lightHaptic();
    onPress();
  };

  const handleHoverIn = () => {
    if (Platform.OS !== 'web' || disabled) return;
    Animated.timing(hoverAnim, {
      toValue: 1,
      duration: 150,
      useNativeDriver: false,
    }).start();
  };

  const handleHoverOut = () => {
    if (Platform.OS !== 'web') return;
    Animated.timing(hoverAnim, {
      toValue: 0,
      duration: 150,
      useNativeDriver: false,
    }).start();
  };

  const renderContent = () => (
    <View
      style={[
        styles.content,
        { flexDirection: iconPosition === 'right' ? 'row-reverse' : 'row' },
      ]}
    >
      {icon && !loading && (
        <Ionicons
          name={icon}
          size={sizeStyles.iconSize}
          color={disabled ? colors.textMuted : config.textColor}
          style={iconPosition === 'right' ? styles.iconRight : styles.iconLeft}
        />
      )}
      {loading && (
        <Animated.View style={styles.loadingIndicator}>
          <Text style={[styles.loadingDot, { color: config.textColor }]}>...</Text>
        </Animated.View>
      )}
      <Text
        style={[
          styles.text,
          {
            fontSize: sizeStyles.fontSize,
            color: disabled ? colors.textMuted : config.textColor,
          },
          textStyle,
        ]}
      >
        {title}
      </Text>
    </View>
  );

  const webHoverProps = Platform.OS === 'web' ? {
    onMouseEnter: handleHoverIn,
    onMouseLeave: handleHoverOut,
  } : {};

  // Animated hover styles for smooth transitions
  const animatedHoverStyle = Platform.OS === 'web' && !disabled ? {
    transform: [
      { scale: Animated.multiply(scale, hoverAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [1, 1.02],
      })) },
      { translateY: hoverAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0, -1],
      })},
    ],
    shadowOpacity: hoverAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [glowColor ? 0.2 : 0, 0.4],
    }),
    shadowRadius: hoverAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [glowColor ? 8 : 0, 16],
    }),
    shadowColor: glowColor || colors.primary,
    shadowOffset: { width: 0, height: 4 },
  } : { transform: [{ scale }] };

  return (
    <Pressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled || loading}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled: disabled || loading }}
      style={Platform.OS === 'web' ? { cursor: disabled ? 'not-allowed' : 'pointer' } as Record<string, string> : undefined}
      {...webHoverProps}
    >
      <Animated.View
        style={[
          animatedHoverStyle,
          { opacity },
          fullWidth && styles.fullWidth,
          glowColor && !disabled && Platform.OS !== 'web' && shadows.glow(glowColor, 0.2),
          style,
        ]}
      >
        <LinearGradient
          colors={disabled ? [glass.background, glass.backgroundDark] : gradientColors as [string, string]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            styles.button,
            {
              paddingVertical: sizeStyles.paddingVertical,
              paddingHorizontal: sizeStyles.paddingHorizontal,
              borderRadius: sizeStyles.borderRadius,
              borderColor: disabled ? glass.border : config.borderColor,
            },
          ]}
        >
          {/* Top shine */}
          <View style={[styles.shine, { borderRadius: sizeStyles.borderRadius }]} />
          {renderContent()}
        </LinearGradient>
      </Animated.View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
  },
  fullWidth: {
    width: '100%',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  text: {
    fontWeight: typography.weight.semibold,
    letterSpacing: 0.3,
  },
  iconLeft: {
    marginRight: spacing.xs,
  },
  iconRight: {
    marginLeft: spacing.xs,
  },
  shine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '50%',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  loadingIndicator: {
    marginRight: spacing.xs,
  },
  loadingDot: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.bold,
  },
});

export default GlassButton;
