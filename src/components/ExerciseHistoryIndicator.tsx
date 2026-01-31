import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { colors, glass, spacing, typography, radius } from '../utils/theme';
import { Ionicons } from '@expo/vector-icons';
import { calculateProgression, formatSuggestion } from '../utils/progressiveOverload';
import { lightHaptic } from '../utils/haptics';

interface ExerciseHistoryIndicatorProps {
  exerciseName: string;
  lastPerformance: {
    date: string;
    sets: number;
    reps: number;
    weight: number;
    workoutName: string;
  } | null;
  loading?: boolean;
  weightUnit?: 'lbs' | 'kg';
  onApplySuggestion?: (sets: number, reps: number, weight: number) => void;
}

const ExerciseHistoryIndicator: React.FC<ExerciseHistoryIndicatorProps> = ({
  exerciseName,
  lastPerformance,
  loading,
  weightUnit = 'lbs',
  onApplySuggestion,
}) => {
  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading history...</Text>
      </View>
    );
  }

  if (!lastPerformance) {
    return (
      <View style={styles.container}>
        <Ionicons name="information-circle-outline" size={16} color="#A0A0A8" />
        <Text style={styles.noHistoryText}>First time performing this exercise</Text>
      </View>
    );
  }

  const formattedDate = new Date(lastPerformance.date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });

  // Calculate progressive overload suggestion
  const suggestion = calculateProgression(
    exerciseName,
    lastPerformance.weight,
    lastPerformance.reps,
    lastPerformance.sets,
    weightUnit
  );

  const suggestionText = formatSuggestion(
    suggestion.suggestedSets,
    suggestion.suggestedReps,
    suggestion.suggestedWeight,
    weightUnit
  );

  const handleApply = () => {
    if (onApplySuggestion) {
      lightHaptic();
      onApplySuggestion(
        suggestion.suggestedSets,
        suggestion.suggestedReps,
        suggestion.suggestedWeight
      );
    }
  };

  return (
    <View style={styles.wrapper}>
      {/* Last Performance - Prominent display */}
      <View style={styles.lastTimeCard}>
        <View style={styles.lastTimeHeader}>
          <Ionicons name="time" size={18} color={colors.primary} />
          <Text style={styles.lastTimeLabel}>Last time</Text>
          <Text style={styles.lastTimeDate}>{formattedDate}</Text>
        </View>
        <View style={styles.lastTimeValues}>
          <View style={styles.lastTimeValue}>
            <Text style={styles.lastTimeNumber}>{lastPerformance.sets}</Text>
            <Text style={styles.lastTimeUnit}>sets</Text>
          </View>
          <Text style={styles.lastTimeSeparator}>×</Text>
          <View style={styles.lastTimeValue}>
            <Text style={styles.lastTimeNumber}>{lastPerformance.reps}</Text>
            <Text style={styles.lastTimeUnit}>reps</Text>
          </View>
          {lastPerformance.weight > 0 && (
            <>
              <Text style={styles.lastTimeSeparator}>@</Text>
              <View style={styles.lastTimeValue}>
                <Text style={styles.lastTimeNumber}>{lastPerformance.weight}</Text>
                <Text style={styles.lastTimeUnit}>{weightUnit}</Text>
              </View>
            </>
          )}
        </View>
      </View>

      {/* Progressive Overload Suggestion - Large tap target */}
      <TouchableOpacity
        style={styles.suggestionCard}
        onPress={handleApply}
        activeOpacity={0.8}
        accessibilityLabel={`Apply suggestion: ${suggestionText}`}
        accessibilityRole="button"
      >
        <View style={styles.suggestionLeft}>
          <View style={styles.suggestionIcon}>
            <Ionicons name="trending-up" size={20} color={colors.success} />
          </View>
          <View>
            <Text style={styles.suggestionLabel}>Suggested</Text>
            <Text style={styles.suggestionText}>{suggestionText}</Text>
          </View>
        </View>
        <View style={styles.suggestionRight}>
          <View style={styles.increaseTag}>
            <Text style={styles.increaseText}>{suggestion.increase}</Text>
          </View>
          {onApplySuggestion && (
            <View style={styles.applyButton}>
              <Ionicons name="checkmark" size={18} color="#000" />
              <Text style={styles.applyText}>Use</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryMuted,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    gap: spacing.sm,
  },
  loadingText: {
    fontSize: typography.size.sm,
    color: colors.textSecondary,
  },
  noHistoryText: {
    fontSize: typography.size.sm,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  // Last time card - prominent display
  lastTimeCard: {
    backgroundColor: colors.primaryMuted,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: `${colors.primary}30`,
  },
  lastTimeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  lastTimeLabel: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
    color: colors.primary,
  },
  lastTimeDate: {
    fontSize: typography.size.sm,
    color: colors.textSecondary,
    marginLeft: 'auto',
  },
  lastTimeValues: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  lastTimeValue: {
    alignItems: 'center',
  },
  lastTimeNumber: {
    fontSize: typography.size.xl,
    fontWeight: typography.weight.bold,
    color: colors.text,
  },
  lastTimeUnit: {
    fontSize: typography.size.xs,
    color: colors.textSecondary,
  },
  lastTimeSeparator: {
    fontSize: typography.size.lg,
    color: colors.textTertiary,
    marginHorizontal: spacing.xs,
  },
  // Suggestion card - large tap target
  suggestionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.successMuted,
    borderRadius: radius.lg,
    padding: spacing.md,
    minHeight: 56,
    borderWidth: 1,
    borderColor: `${colors.success}30`,
  },
  suggestionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
  },
  suggestionIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    backgroundColor: `${colors.success}20`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  suggestionLabel: {
    fontSize: typography.size.xs,
    color: colors.success,
    fontWeight: typography.weight.medium,
  },
  suggestionText: {
    fontSize: typography.size.base,
    color: colors.text,
    fontWeight: typography.weight.semibold,
  },
  suggestionRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  increaseTag: {
    backgroundColor: `${colors.success}20`,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
  },
  increaseText: {
    fontSize: typography.size.xs,
    color: colors.success,
    fontWeight: typography.weight.bold,
  },
  applyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.success,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
  },
  applyText: {
    fontSize: typography.size.sm,
    color: '#000000',
    fontWeight: typography.weight.bold,
  },
});

export default ExerciseHistoryIndicator;
