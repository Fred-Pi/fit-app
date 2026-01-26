import React, { useEffect, useRef, useState } from 'react';
import { Text, StyleSheet, Animated, View, TextStyle } from 'react-native';
import { colors, typography } from '../utils/theme';

interface AnimatedNumberProps {
  value: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  style?: TextStyle;
  suffixStyle?: TextStyle;
  color?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';
  animated?: boolean;
  formatNumber?: boolean;
}

const sizeStyles: Record<string, { fontSize: number; fontWeight: string }> = {
  sm: { fontSize: typography.size.base, fontWeight: typography.weight.semibold },
  md: { fontSize: typography.size.xl, fontWeight: typography.weight.bold },
  lg: { fontSize: typography.size['2xl'], fontWeight: typography.weight.bold },
  xl: { fontSize: typography.size['3xl'], fontWeight: typography.weight.extrabold },
  '2xl': { fontSize: typography.size['4xl'], fontWeight: typography.weight.extrabold },
  '3xl': { fontSize: typography.size['5xl'], fontWeight: typography.weight.extrabold },
};

const AnimatedNumber: React.FC<AnimatedNumberProps> = ({
  value,
  duration = 800,
  prefix = '',
  suffix = '',
  decimals = 0,
  style,
  suffixStyle,
  color = colors.text,
  size = 'lg',
  animated = true,
  formatNumber = true,
}) => {
  const animatedValue = useRef(new Animated.Value(0)).current;
  const [displayValue, setDisplayValue] = useState(animated ? 0 : value);
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (animated) {
      // Reset and animate
      animatedValue.setValue(0);

      Animated.parallel([
        // Count animation
        Animated.timing(animatedValue, {
          toValue: value,
          duration,
          useNativeDriver: false,
        }),
        // Subtle scale pulse
        Animated.sequence([
          Animated.timing(scaleAnim, {
            toValue: 1.05,
            duration: duration * 0.3,
            useNativeDriver: true,
          }),
          Animated.spring(scaleAnim, {
            toValue: 1,
            useNativeDriver: true,
            damping: 10,
            stiffness: 100,
          }),
        ]),
      ]).start();

      const listener = animatedValue.addListener(({ value: v }) => {
        setDisplayValue(v);
      });

      return () => animatedValue.removeListener(listener);
    } else {
      setDisplayValue(value);
    }
  }, [value, duration, animated]);

  const formatDisplayValue = () => {
    const num = decimals > 0 ? displayValue.toFixed(decimals) : Math.round(displayValue);
    if (formatNumber && typeof num === 'number') {
      return num.toLocaleString();
    }
    if (formatNumber && typeof num === 'string') {
      const parts = num.split('.');
      parts[0] = parseInt(parts[0]).toLocaleString();
      return parts.join('.');
    }
    return num.toString();
  };

  const sizeConfig = sizeStyles[size];

  return (
    <Animated.View style={[styles.container, { transform: [{ scale: scaleAnim }] }]}>
      {prefix && (
        <Text
          style={[
            styles.prefix,
            { color, fontSize: sizeConfig.fontSize * 0.6 },
          ]}
        >
          {prefix}
        </Text>
      )}
      <Text
        style={[
          styles.number,
          {
            color,
            fontSize: sizeConfig.fontSize,
            fontWeight: sizeConfig.fontWeight as TextStyle['fontWeight'],
          },
          style,
        ]}
      >
        {formatDisplayValue()}
      </Text>
      {suffix && (
        <Text
          style={[
            styles.suffix,
            { color: colors.textSecondary, fontSize: sizeConfig.fontSize * 0.5 },
            suffixStyle,
          ]}
        >
          {suffix}
        </Text>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  prefix: {
    fontWeight: typography.weight.medium,
    marginRight: 2,
  },
  number: {
    letterSpacing: -1,
  },
  suffix: {
    fontWeight: typography.weight.medium,
    marginLeft: 4,
  },
});

export default AnimatedNumber;
