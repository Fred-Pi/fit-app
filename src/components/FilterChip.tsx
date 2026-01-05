import React from 'react';
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
  color = '#3A9BFF',
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
          color={active ? '#FFFFFF' : '#A0A0A8'}
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
    color: '#FFFFFF',
    fontWeight: '700',
  },
  inactiveLabel: {
    color: '#A0A0A8',
    fontWeight: '500',
  },
});

export default FilterChip;
