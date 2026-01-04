import React from 'react';
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
  color = '#3A9BFF',
  height = 12,
}) => {
  const percentage = Math.min((current / target) * 100, 100);
  const isOverTarget = current > target;

  return (
    <View style={styles.container}>
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
              backgroundColor: isOverTarget ? '#FF6B6B' : color,
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
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  target: {
    fontSize: 18,
    fontWeight: '600',
    color: '#A0A0A8',
  },
  barContainer: {
    width: '100%',
    backgroundColor: '#2A2A30',
    borderRadius: 999,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#3A3A42',
  },
  barFill: {
    height: '100%',
    borderRadius: 999,
  },
});

export default ProgressBar;
