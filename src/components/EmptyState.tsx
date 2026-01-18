import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { colors } from '../utils/theme'

interface EmptyStateProps {
  icon?: keyof typeof Ionicons.glyphMap
  iconSize?: number
  iconColor?: string
  title: string
  subtitle?: string
}

const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  iconSize = 48,
  iconColor = colors.textTertiary,
  title,
  subtitle,
}) => {
  return (
    <View style={styles.container}>
      {icon && (
        <Ionicons name={icon} size={iconSize} color={iconColor} />
      )}
      <Text style={[styles.title, !icon && styles.titleNoIcon]}>{title}</Text>
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 32,
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textSecondary,
    textAlign: 'center',
  },
  titleNoIcon: {
    marginTop: 0,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textTertiary,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
})

export default EmptyState
