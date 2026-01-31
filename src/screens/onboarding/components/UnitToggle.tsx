import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, spacing, typography, radius, glass } from '../../../utils/theme';
import { lightHaptic } from '../../../utils/haptics';

interface UnitToggleProps<T extends string> {
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
}

function UnitToggle<T extends string>({ value, options, onChange }: UnitToggleProps<T>) {
  const handlePress = (newValue: T) => {
    if (newValue !== value) {
      lightHaptic();
      onChange(newValue);
    }
  };

  return (
    <View style={styles.container}>
      {options.map((option) => (
        <TouchableOpacity
          key={option.value}
          style={[styles.option, value === option.value && styles.optionActive]}
          onPress={() => handlePress(option.value)}
          activeOpacity={0.7}
        >
          <Text style={[styles.optionText, value === option.value && styles.optionTextActive]}>
            {option.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: glass.backgroundLight,
    borderRadius: radius.lg,
    padding: 4,
    gap: 4,
  },
  option: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    minWidth: 50,
    alignItems: 'center',
  },
  optionActive: {
    backgroundColor: colors.primary,
  },
  optionText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
    color: colors.textSecondary,
  },
  optionTextActive: {
    color: colors.text,
  },
});

export default UnitToggle;
