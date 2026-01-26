import React from 'react';
import { colors, glass, spacing, typography, radius } from '../utils/theme'
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface FilterChipProps {
  label: string;
  active: boolean;
  onPress: () => void;
  icon?: string;
  color?: string;
}

const FilterChip: React.FC<FilterChipProps> = ({
  label,
  active,
  onPress,
  icon,
  color = colors.primary,
}) => {
  return (
    <TouchableOpacity
      style={[
        styles.chip,
        active ? { backgroundColor: color } : styles.inactiveChip,
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {icon && (
        <Ionicons
          name={icon as any}
          size={16}
          color={active ? colors.text : colors.textSecondary}
          style={styles.icon}
        />
      )}
      <Text
        style={[
          styles.label,
          active ? styles.activeLabel : styles.inactiveLabel,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius['2xl'],
    marginRight: spacing.sm,
    borderWidth: 1,
    borderColor: glass.border,
  },
  inactiveChip: {
    backgroundColor: glass.backgroundLight,
  },
  icon: {
    marginRight: spacing.sm,
  },
  label: {
    fontSize: typography.size.sm,
    letterSpacing: 0.2,
  },
  activeLabel: {
    color: colors.text,
    fontWeight: typography.weight.bold,
  },
  inactiveLabel: {
    color: colors.textSecondary,
    fontWeight: typography.weight.medium,
  },
});

export default FilterChip;
