import React from 'react';
import { colors } from '../utils/theme'
import { View, Text, StyleSheet } from 'react-native';

interface ProgressBarProps {
  current: number;
  target: number;
  unit?: string;
  color?: string;
  height?: number;
}

const ProgressBar: React.FC<ProgressBarProps> = ({
  current,
  target,
  unit = '',
  color = '#00D9FF',
  height = 14,
}) => {
  const percentage = Math.min((current / target) * 100, 100);
  const isOverTarget = current > target;

  return (
    <View
      style={styles.container}
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: target, now: current }}
      accessibilityLabel={`Progress: ${Math.round(current)} of ${Math.round(target)}${unit ? ` ${unit}` : ''}`}
    >
      <View style={styles.labelContainer}>
        <Text style={styles.current}>
          {Math.round(current).toLocaleString()}
          {unit && ` ${unit}`}
        </Text>
        <Text style={styles.target}>
          / {Math.round(target).toLocaleString()}
          {unit && ` ${unit}`}
        </Text>
      </View>
      <View style={[styles.barContainer, { height }]}>
        <View
          style={[
            styles.barFill,
            {
              width: `${percentage}%`,
              backgroundColor: isOverTarget ? '#FF5252' : color,
              shadowColor: isOverTarget ? '#FF5252' : color,
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.6,
              shadowRadius: 8,
            },
          ]}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  labelContainer: {
    flexDirection: 'row',
    marginBottom: 10,
    alignItems: 'baseline',
    gap: 6,
  },
  current: {
    fontSize: 30,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: 0.5,
  },
  target: {
    fontSize: 18,
    fontWeight: '600',
    color: '#B8C5D6',
  },
  barContainer: {
    width: '100%',
    backgroundColor: 'rgba(45, 53, 72, 0.5)',
    borderRadius: 999,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#2D3548',
  },
  barFill: {
    height: '100%',
    borderRadius: 999,
  },
});

export default ProgressBar;
