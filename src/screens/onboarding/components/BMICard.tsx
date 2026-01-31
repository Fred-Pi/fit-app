import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import GlassCard from '../../../components/GlassCard';
import { colors, spacing, typography, radius, glass } from '../../../utils/theme';
import { BMIResult } from '../../../utils/bmiCalculator';

interface BMICardProps {
  bmiResult: BMIResult;
}

const BMICard: React.FC<BMICardProps> = ({ bmiResult }) => {
  return (
    <GlassCard accent="none" glowIntensity="none" padding="lg">
      <View style={styles.container}>
        <View style={styles.header}>
          <Ionicons name="body-outline" size={24} color={bmiResult.color} />
          <Text style={styles.title}>Your BMI</Text>
        </View>

        <View style={styles.valueContainer}>
          <Text style={[styles.value, { color: bmiResult.color }]}>{bmiResult.value}</Text>
          <View style={[styles.categoryBadge, { backgroundColor: bmiResult.color + '20' }]}>
            <Text style={[styles.categoryText, { color: bmiResult.color }]}>{bmiResult.label}</Text>
          </View>
        </View>

        <View style={styles.scaleContainer}>
          <View style={styles.scale}>
            <View style={[styles.scaleSegment, { backgroundColor: '#3B82F6', flex: 18.5 }]} />
            <View style={[styles.scaleSegment, { backgroundColor: '#10B981', flex: 6.5 }]} />
            <View style={[styles.scaleSegment, { backgroundColor: '#F59E0B', flex: 5 }]} />
            <View style={[styles.scaleSegment, { backgroundColor: '#F97316', flex: 10 }]} />
          </View>
          <View style={styles.scaleLabels}>
            <Text style={styles.scaleLabel}>18.5</Text>
            <Text style={styles.scaleLabel}>25</Text>
            <Text style={styles.scaleLabel}>30</Text>
          </View>
        </View>

        <Text style={styles.disclaimer}>
          BMI is one of many health indicators and doesn't account for muscle mass, bone density, or
          body composition.
        </Text>
      </View>
    </GlassCard>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  title: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.semibold,
    color: colors.text,
  },
  valueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  value: {
    fontSize: 56,
    fontWeight: typography.weight.extrabold,
    letterSpacing: -2,
  },
  categoryBadge: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: radius.full,
  },
  categoryText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
  },
  scaleContainer: {
    gap: spacing.xs,
  },
  scale: {
    flexDirection: 'row',
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  scaleSegment: {
    height: '100%',
  },
  scaleLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xs,
  },
  scaleLabel: {
    fontSize: typography.size.xs,
    color: colors.textTertiary,
  },
  disclaimer: {
    fontSize: typography.size.xs,
    color: colors.textTertiary,
    textAlign: 'center',
    lineHeight: 16,
  },
});

export default BMICard;
