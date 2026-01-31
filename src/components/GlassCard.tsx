import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ViewStyle,
  Animated,
  Pressable,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, glass, gradients, shadows, radius, spacing } from '../utils/theme';

type AccentColor = 'blue' | 'emerald' | 'rose' | 'violet' | 'gold' | 'cyan' | 'none';

interface GlassCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  accent?: AccentColor;
  glowIntensity?: 'none' | 'subtle' | 'medium' | 'strong';
  onPress?: () => void;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  animated?: boolean;
}

const accentColors: Record<Exclude<AccentColor, 'none'>, { primary: string; glow: string }> = {
  blue: { primary: colors.primary, glow: glass.glow.blue },
  emerald: { primary: colors.steps, glow: glass.glow.emerald },
  rose: { primary: colors.nutrition, glow: glass.glow.rose },
  violet: { primary: colors.analytics, glow: glass.glow.violet },
  gold: { primary: colors.gold, glow: glass.glow.gold },
  cyan: { primary: colors.cyan, glow: glass.glow.cyan },
};

const glowIntensities = {
  none: 0,
  subtle: 0.15,
  medium: 0.25,
  strong: 0.4,
};

const paddingSizes = {
  none: 0,
  sm: spacing.md,
  md: spacing.lg,
  lg: spacing.xl,
};

const GlassCard: React.FC<GlassCardProps> = ({
  children,
  style,
  accent = 'none',
  glowIntensity = 'subtle',
  onPress,
  padding = 'md',
  animated = true,
}) => {
  const scale = React.useRef(new Animated.Value(1)).current;
  const [isHovered, setIsHovered] = useState(false);

  const handlePressIn = () => {
    if (!onPress || !animated) return;
    Animated.spring(scale, {
      toValue: 0.98,
      useNativeDriver: true,
      damping: 15,
      stiffness: 300,
    }).start();
  };

  const handlePressOut = () => {
    if (!onPress || !animated) return;
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      damping: 15,
      stiffness: 300,
    }).start();
  };

  const accentConfig = accent !== 'none' ? accentColors[accent] : null;
  const glowOpacity = glowIntensities[glowIntensity];

  const cardContent = (
    <LinearGradient
      colors={gradients.card as [string, string]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[
        styles.card,
        { padding: paddingSizes[padding] },
        accentConfig && glowOpacity > 0 && shadows.glow(accentConfig.primary, glowOpacity),
        style,
      ]}
    >
      {/* Top shine effect */}
      <View style={styles.shine} />

      {/* Accent glow overlay */}
      {accentConfig && glowOpacity > 0 && (
        <View
          style={[
            styles.accentGlow,
            { backgroundColor: accentConfig.glow },
          ]}
        />
      )}

      {/* Content */}
      <View style={styles.content}>
        {children}
      </View>
    </LinearGradient>
  );

  if (onPress) {
    const webHoverProps = Platform.OS === 'web' ? {
      onMouseEnter: () => setIsHovered(true),
      onMouseLeave: () => setIsHovered(false),
    } : {};

    return (
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={Platform.OS === 'web' ? { cursor: 'pointer' } as any : undefined}
        {...webHoverProps}
      >
        <Animated.View style={[
          { transform: [{ scale }] },
          isHovered && styles.hovered,
        ]}>
          {cardContent}
        </Animated.View>
      </Pressable>
    );
  }

  return cardContent;
};

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.xl,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: glass.border,
    overflow: 'hidden',
    position: 'relative',
  },
  shine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: glass.borderLight,
  },
  accentGlow: {
    position: 'absolute',
    top: -50,
    left: '25%',
    right: '25%',
    height: 100,
    borderRadius: 100,
    opacity: 0.5,
  },
  content: {
    position: 'relative',
    zIndex: 1,
  },
  hovered: {
    ...Platform.select({
      web: {
        transform: [{ scale: 1.01 }],
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
      },
      default: {},
    }),
  },
});

export default GlassCard;
