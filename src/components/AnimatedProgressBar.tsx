import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, gradients, glass, radius, typography, spacing } from '../utils/theme';

type ColorTheme = 'blue' | 'green' | 'rose' | 'violet' | 'gold';

interface AnimatedProgressBarProps {
  current: number;
  target: number;
  unit?: string;
  theme?: ColorTheme;
  height?: number;
  showLabels?: boolean;
  animated?: boolean;
  compact?: boolean;
}

const themeConfig: Record<ColorTheme, { gradient: string[]; glow: string }> = {
  blue: { gradient: gradients.progressBlue, glow: glass.glow.blue },
  green: { gradient: gradients.progressGreen, glow: glass.glow.emerald },
  rose: { gradient: gradients.progressRose, glow: glass.glow.rose },
  violet: { gradient: gradients.progressViolet, glow: glass.glow.violet },
  gold: { gradient: gradients.progressGold, glow: glass.glow.gold },
};

const AnimatedProgressBar: React.FC<AnimatedProgressBarProps> = ({
  current,
  target,
  unit = '',
  theme = 'blue',
  height = 12,
  showLabels = true,
  animated = true,
  compact = false,
}) => {
  const percentage = Math.min((current / target) * 100, 100);
  const isOverTarget = current > target;
  const widthAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const countAnim = useRef(new Animated.Value(0)).current;
  const [displayValue, setDisplayValue] = React.useState(animated ? 0 : current);

  const config = isOverTarget
    ? { gradient: [colors.error, colors.errorLight], glow: 'rgba(239, 68, 68, 0.4)' }
    : themeConfig[theme];

  useEffect(() => {
    if (animated) {
      // Animate width
      Animated.spring(widthAnim, {
        toValue: percentage,
        useNativeDriver: false,
        damping: 15,
        stiffness: 80,
      }).start();

      // Animate count
      countAnim.setValue(0);
      Animated.timing(countAnim, {
        toValue: current,
        duration: 800,
        useNativeDriver: false,
      }).start();

      const listener = countAnim.addListener(({ value }) => {
        setDisplayValue(Math.round(value));
      });

      return () => countAnim.removeListener(listener);
    } else {
      widthAnim.setValue(percentage);
      setDisplayValue(current);
    }
  }, [current, percentage, animated]);

  // Pulse animation when at 100%
  useEffect(() => {
    if (percentage >= 100 && animated) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.02,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [percentage, animated]);

  const animatedWidth = widthAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.container}>
      {showLabels && (
        <View style={[styles.labelContainer, compact && styles.labelContainerCompact]}>
          <View style={styles.valueRow}>
            <Text style={[styles.current, compact && styles.currentCompact]}>
              {displayValue.toLocaleString()}
            </Text>
            {unit && (
              <Text style={[styles.unit, compact && styles.unitCompact]}>{unit}</Text>
            )}
          </View>
          <Text style={[styles.target, compact && styles.targetCompact]}>
            / {Math.round(target).toLocaleString()} {unit}
          </Text>
        </View>
      )}

      <Animated.View
        style={[
          styles.barOuter,
          { height },
          { transform: [{ scale: pulseAnim }] },
        ]}
      >
        {/* Track */}
        <View style={[styles.track, { height }]} />

        {/* Fill */}
        <Animated.View style={[styles.fillContainer, { width: animatedWidth, height }]}>
          <LinearGradient
            colors={config.gradient as [string, string]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.fill, { height }]}
          />
          {/* Glow effect */}
          <View
            style={[
              styles.glow,
              {
                backgroundColor: config.glow,
                height: height * 2,
                top: -height / 2,
              },
            ]}
          />
          {/* Shine highlight */}
          <View style={[styles.shine, { height: height / 3 }]} />
        </Animated.View>

        {/* Percentage indicator for completed */}
        {percentage >= 100 && (
          <View style={styles.completeBadge}>
            <Text style={styles.completeText}>
              {isOverTarget ? `+${Math.round(current - target)}` : '100%'}
            </Text>
          </View>
        )}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: spacing.sm,
    gap: spacing.xs,
  },
  labelContainerCompact: {
    marginBottom: spacing.xs,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  current: {
    fontSize: typography.size['3xl'],
    fontWeight: typography.weight.extrabold,
    color: colors.text,
    letterSpacing: -0.5,
  },
  currentCompact: {
    fontSize: typography.size.xl,
  },
  unit: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
    color: colors.textSecondary,
    marginLeft: spacing.xs,
  },
  unitCompact: {
    fontSize: typography.size.sm,
  },
  target: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.medium,
    color: colors.textTertiary,
  },
  targetCompact: {
    fontSize: typography.size.sm,
  },
  barOuter: {
    width: '100%',
    borderRadius: radius.full,
    overflow: 'hidden',
    position: 'relative',
  },
  track: {
    position: 'absolute',
    width: '100%',
    backgroundColor: glass.backgroundLight,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: glass.border,
  },
  fillContainer: {
    position: 'absolute',
    left: 0,
    borderRadius: radius.full,
    overflow: 'hidden',
  },
  fill: {
    width: '100%',
    borderRadius: radius.full,
  },
  glow: {
    position: 'absolute',
    right: 0,
    width: 30,
    borderRadius: radius.full,
    opacity: 0.8,
  },
  shine: {
    position: 'absolute',
    top: 2,
    left: 4,
    right: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: radius.full,
  },
  completeBadge: {
    position: 'absolute',
    right: 8,
    top: '50%',
    transform: [{ translateY: -8 }],
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  completeText: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.bold,
    color: colors.text,
  },
});

export default AnimatedProgressBar;
