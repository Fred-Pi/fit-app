import React from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { colors, spacing } from '../../../utils/theme';

interface StepIndicatorProps {
  currentStep: number;
  totalSteps: number;
}

const StepIndicator: React.FC<StepIndicatorProps> = ({ currentStep, totalSteps }) => {
  return (
    <View style={styles.container}>
      {Array.from({ length: totalSteps }).map((_, index) => (
        <View
          key={index}
          style={[
            styles.dot,
            currentStep === index && styles.dotActive,
            currentStep > index && styles.dotCompleted,
          ]}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.sm,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.textTertiary,
  },
  dotActive: {
    width: 24,
    backgroundColor: colors.primary,
  },
  dotCompleted: {
    backgroundColor: colors.primary,
    opacity: 0.5,
  },
});

export default StepIndicator;
