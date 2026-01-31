import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import GlassCard from '../../../components/GlassCard';
import BMICard from '../components/BMICard';
import { colors, glass, spacing, typography, radius } from '../../../utils/theme';
import { BMIResult, formatHeight, formatWeight } from '../../../utils/bmiCalculator';
import { lightHaptic } from '../../../utils/haptics';

interface SummaryStepProps {
  name: string;
  age: number;
  heightCm: number;
  heightUnit: 'cm' | 'ft';
  weightKg: number;
  weightUnit: 'kg' | 'lbs';
  calorieTarget: number;
  stepGoal: number;
  bmiResult: BMIResult;
  onEditStep: (step: number) => void;
}

const SummaryStep: React.FC<SummaryStepProps> = ({
  name,
  age,
  heightCm,
  heightUnit,
  weightKg,
  weightUnit,
  calorieTarget,
  stepGoal,
  bmiResult,
  onEditStep,
}) => {
  const handleEdit = (step: number) => {
    lightHaptic();
    onEditStep(step);
  };

  const summaryItems = [
    { label: 'Age', value: `${age} years`, step: 0, icon: 'calendar-outline' as const },
    { label: 'Height', value: formatHeight(heightCm, heightUnit), step: 0, icon: 'resize-outline' as const },
    { label: 'Weight', value: formatWeight(weightKg, weightUnit), step: 0, icon: 'scale-outline' as const },
    { label: 'Daily Calories', value: `${calorieTarget.toLocaleString()} kcal`, step: 1, icon: 'flame-outline' as const },
    { label: 'Daily Steps', value: `${stepGoal.toLocaleString()} steps`, step: 1, icon: 'footsteps-outline' as const },
  ];

  return (
    <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>{name ? `${name}'s Profile` : 'Your Profile'}</Text>
      <Text style={styles.subtitle}>Review your information</Text>

      <View style={styles.content}>
        {/* BMI Card */}
        <BMICard bmiResult={bmiResult} />

        {/* Summary List */}
        <GlassCard accent="none" glowIntensity="none" padding="lg">
          <View style={styles.summaryList}>
            {summaryItems.map((item, index) => (
              <View key={item.label} style={[styles.summaryItem, index === summaryItems.length - 1 && styles.summaryItemLast]}>
                <View style={styles.summaryLeft}>
                  <View style={styles.iconContainer}>
                    <Ionicons name={item.icon} size={18} color={colors.textSecondary} />
                  </View>
                  <View>
                    <Text style={styles.summaryLabel}>{item.label}</Text>
                    <Text style={styles.summaryValue}>{item.value}</Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.editButton}
                  onPress={() => handleEdit(item.step)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="pencil" size={16} color={colors.primary} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </GlassCard>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    flex: 1,
    width: '100%',
  },
  container: {
    alignItems: 'center',
    paddingBottom: spacing['2xl'],
  },
  title: {
    fontSize: typography.size['4xl'],
    fontWeight: typography.weight.extrabold,
    color: colors.text,
    textAlign: 'center',
    letterSpacing: -1,
    marginBottom: spacing.md,
  },
  subtitle: {
    fontSize: typography.size.lg,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 26,
  },
  content: {
    marginTop: spacing['2xl'],
    width: '100%',
    gap: spacing.lg,
  },
  summaryList: {
    gap: spacing.sm,
  },
  summaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: glass.border,
  },
  summaryItemLast: {
    borderBottomWidth: 0,
  },
  summaryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    backgroundColor: glass.backgroundLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryLabel: {
    fontSize: typography.size.xs,
    color: colors.textTertiary,
    marginBottom: 2,
  },
  summaryValue: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.medium,
    color: colors.text,
  },
  editButton: {
    width: 32,
    height: 32,
    borderRadius: radius.md,
    backgroundColor: colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default SummaryStep;
