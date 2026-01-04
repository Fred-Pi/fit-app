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
  color = '#007AFF',
  height = 8,
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
    marginBottom: 6,
    alignItems: 'baseline',
  },
  current: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
  },
  target: {
    fontSize: 16,
    color: '#666',
    marginLeft: 4,
  },
  barContainer: {
    width: '100%',
    backgroundColor: '#E5E5E5',
    borderRadius: 999,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 999,
  },
});

export default ProgressBar;
