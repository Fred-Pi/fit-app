import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import GlassCard from './GlassCard';
import AnimatedProgressBar from './AnimatedProgressBar';
import AnimatedNumber from './AnimatedNumber';
import EmptyState from './EmptyState';
import { WeeklyStats, WeekComparison } from '../types';
import { formatWeekRange } from '../utils/dateUtils';
import { colors, glass, spacing, typography, radius } from '../utils/theme';

interface WeeklyStatsCardProps {
  currentWeek: WeeklyStats;
  previousWeek?: WeeklyStats;
  comparison?: WeekComparison;
}

const WeeklyStatsCard: React.FC<WeeklyStatsCardProps> = ({
  currentWeek,
  previousWeek,
  comparison,
}) => {
  const weekRangeText = formatWeekRange(currentWeek.weekStart, currentWeek.weekEnd);

  const renderComparison = (value: number, percent: number) => {
    if (!previousWeek || value === 0) return null;

    const isPositive = value > 0;
    const isNegative = value < 0;
    const color = isPositive ? colors.success : isNegative ? colors.error : colors.textSecondary;
    const bgColor = isPositive ? colors.successMuted : isNegative ? colors.errorMuted : glass.backgroundLight;
    const icon = isPositive ? 'trending-up' : isNegative ? 'trending-down' : 'remove';
    const sign = isPositive ? '+' : '';

    return (
      <View style={[styles.comparisonContainer, { backgroundColor: bgColor }]}>
        <Ionicons name={icon} size={14} color={color} />
        <Text style={[styles.comparisonText, { color }]}>
          {sign}{Math.abs(percent)}%
        </Text>
      </View>
    );
  };

  const hasNoActivity = currentWeek.totalWorkouts === 0 &&
    currentWeek.totalCalories === 0 &&
    currentWeek.totalSteps === 0;

  return (
    <GlassCard accent="cyan" glowIntensity="subtle">
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <LinearGradient
            colors={[colors.cyanLight, colors.cyan]}
            style={styles.iconGradient}
          >
            <Ionicons name="calendar" size={20} color={colors.text} />
          </LinearGradient>
          <View>
            <Text style={styles.headerTitle}>This Week</Text>
            <Text style={styles.weekRange}>{weekRangeText}</Text>
          </View>
        </View>
      </View>

      {hasNoActivity ? (
        <EmptyState
          icon="information-circle-outline"
          iconSize={32}
          iconColor={colors.textTertiary}
          title="No activity this week yet"
          subtitle="Start logging workouts, nutrition, and steps!"
        />
      ) : (
        <>
          {/* Workouts Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIconBadge}>
                <Ionicons name="barbell" size={16} color={colors.workout} />
              </View>
              <Text style={styles.sectionTitle}>Workouts</Text>
              {comparison && renderComparison(comparison.workouts, comparison.workoutsPercent)}
            </View>
            <View style={styles.workoutContent}>
              <AnimatedNumber
                value={currentWeek.totalWorkouts}
                size="lg"
                suffix={currentWeek.totalWorkouts === 1 ? 'workout' : 'workouts'}
                color={colors.workout}
              />
              {currentWeek.daysActive > 0 && (
                <Text style={styles.daysActive}>
                  {currentWeek.daysActive} {currentWeek.daysActive === 1 ? 'day' : 'days'} active
                </Text>
              )}
            </View>
          </View>

          {/* Calories Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIconBadge}>
                <Ionicons name="restaurant" size={16} color={colors.nutrition} />
              </View>
              <Text style={styles.sectionTitle}>Calories</Text>
              {comparison && renderComparison(comparison.calories, comparison.caloriesPercent)}
            </View>
            <AnimatedProgressBar
              current={currentWeek.totalCalories}
              target={currentWeek.calorieTarget}
              theme="rose"
              height={10}
              compact
            />
            <Text style={styles.avgText}>
              Avg: {currentWeek.avgCalories.toLocaleString()}/day
            </Text>
          </View>

          {/* Steps Section */}
          <View style={[styles.section, styles.lastSection]}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIconBadge}>
                <Ionicons name="footsteps" size={16} color={colors.steps} />
              </View>
              <Text style={styles.sectionTitle}>Steps</Text>
              {comparison && renderComparison(comparison.steps, comparison.stepsPercent)}
            </View>
            <AnimatedProgressBar
              current={currentWeek.totalSteps}
              target={currentWeek.stepGoal}
              theme="green"
              height={10}
              compact
            />
            <Text style={styles.avgText}>
              Avg: {currentWeek.avgSteps.toLocaleString()}/day
            </Text>
          </View>
        </>
      )}
    </GlassCard>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: glass.border,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  iconGradient: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.lg,
  },
  headerTitle: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.bold,
    color: colors.text,
  },
  weekRange: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
    color: colors.textSecondary,
    marginTop: 2,
  },
  section: {
    marginBottom: spacing.lg,
  },
  lastSection: {
    marginBottom: 0,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  sectionIconBadge: {
    width: 28,
    height: 28,
    borderRadius: radius.md,
    backgroundColor: glass.backgroundLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    flex: 1,
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
    color: colors.text,
  },
  workoutContent: {
    paddingVertical: spacing.sm,
  },
  daysActive: {
    fontSize: typography.size.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  avgText: {
    fontSize: typography.size.sm,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
  comparisonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.md,
  },
  comparisonText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
  },
});

export default WeeklyStatsCard;
