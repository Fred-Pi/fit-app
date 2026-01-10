import React from 'react';
import { colors } from '../utils/theme'
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
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  inactiveChip: {
    backgroundColor: '#2A2A30',
  },
  icon: {
    marginRight: 6,
  },
  label: {
    fontSize: 14,
    letterSpacing: 0.2,
  },
  activeLabel: {
    color: colors.text,
    fontWeight: '700',
  },
  inactiveLabel: {
    color: colors.textSecondary,
    fontWeight: '500',
  },
});

export default FilterChip;
