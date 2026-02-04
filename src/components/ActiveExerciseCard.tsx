/**
 * ActiveExerciseCard - Collapsible exercise card with set rows
 *
 * Used in ActiveWorkoutScreen for managing exercises during a workout.
 * Auto-collapses when all sets are complete.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { ActiveExerciseLog, ActiveSetLog, ExerciseHistoryData } from '../stores/activeWorkoutStore';
import { colors, glass, radius, spacing, typography } from '../utils/theme';
import { lightHaptic } from '../utils/haptics';
import GlassCard from './GlassCard';
import SetRow from './SetRow';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface ActiveExerciseCardProps {
  exercise: ActiveExerciseLog;
  weightUnit: 'kg' | 'lbs';
  onUpdateSet: (setId: string, data: Partial<ActiveSetLog>) => void;
  onCompleteSet: (setId: string) => void;
  onAddSet: () => void;
  onRemoveSet: (setId: string) => void;
  onRemoveExercise: () => void;
  onToggleCollapse: () => void;
  getExerciseHistory: (exerciseName: string) => Promise<ExerciseHistoryData | null>;
}

const ActiveExerciseCard: React.FC<ActiveExerciseCardProps> = ({
  exercise,
  weightUnit,
  onUpdateSet,
  onCompleteSet,
  onAddSet,
  onRemoveSet,
  onRemoveExercise,
  onToggleCollapse,
  getExerciseHistory,
}) => {
  const [historyData, setHistoryData] = useState<ExerciseHistoryData | null>(null);
  const [_loadingHistory, setLoadingHistory] = useState(false);

  // Animation values
  const chevronRotation = useSharedValue(exercise.isCollapsed ? -90 : 0);

  useEffect(() => {
    chevronRotation.value = withTiming(exercise.isCollapsed ? -90 : 0, { duration: 200 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exercise.isCollapsed]);

  // Load exercise history on mount
  useEffect(() => {
    const loadHistory = async () => {
      setLoadingHistory(true);
      const history = await getExerciseHistory(exercise.exerciseName);
      setHistoryData(history);
      setLoadingHistory(false);
    };
    loadHistory();
  }, [exercise.exerciseName, getExerciseHistory]);

  const chevronStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${chevronRotation.value}deg` }],
  }));

  const completedSets = exercise.sets.filter((s) => s.completed).length;
  const totalSets = exercise.sets.length;
  const isComplete = totalSets > 0 && completedSets === totalSets;

  const handleToggleCollapse = () => {
    lightHaptic();
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    onToggleCollapse();
  };

  const handleRemoveExercise = () => {
    lightHaptic();
    onRemoveExercise();
  };

  const handleAddSet = () => {
    lightHaptic();
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    onAddSet();
  };

  // Get previous set data for suggestions
  const getPreviousSetData = (setIndex: number) => {
    if (historyData && setIndex === 0) {
      return { reps: historyData.reps, weight: historyData.weight };
    }
    if (setIndex > 0) {
      const prevSet = exercise.sets[setIndex - 1];
      return { reps: prevSet.reps, weight: prevSet.weight };
    }
    return undefined;
  };

  return (
    <GlassCard
      accent={isComplete ? 'emerald' : undefined}
      glowIntensity={isComplete ? 'subtle' : 'none'}
      style={styles.card}
      padding="none"
    >
      {/* Header */}
      <TouchableOpacity
        style={styles.header}
        onPress={handleToggleCollapse}
        activeOpacity={0.7}
      >
        <Animated.View style={chevronStyle}>
          <Ionicons
            name="chevron-down"
            size={20}
            color={isComplete ? colors.success : colors.textSecondary}
          />
        </Animated.View>

        <View style={styles.headerInfo}>
          <Text style={[styles.exerciseName, isComplete && styles.exerciseNameComplete]}>
            {exercise.exerciseName}
          </Text>
          <Text style={styles.setsProgress}>
            {completedSets}/{totalSets} sets
            {isComplete && ' ✓'}
          </Text>
        </View>

        {historyData && !exercise.isCollapsed && (
          <View style={styles.historyBadge}>
            <Ionicons name="time-outline" size={12} color={colors.primary} />
            <Text style={styles.historyText}>
              Last: {historyData.weight}{weightUnit} × {historyData.reps}
            </Text>
          </View>
        )}

        <Pressable
          style={({ pressed }) => [styles.removeButton, pressed && styles.removeButtonPressed]}
          onPress={handleRemoveExercise}
        >
          <Ionicons name="trash-outline" size={18} color={colors.error} />
        </Pressable>
      </TouchableOpacity>

      {/* Collapsible Content */}
      {!exercise.isCollapsed && (
        <View style={styles.content}>
          {/* Sets List */}
          <View style={styles.setsList}>
            {exercise.sets.map((set, index) => (
              <SetRow
                key={set.id}
                setNumber={index + 1}
                set={set}
                weightUnit={weightUnit}
                previousSet={getPreviousSetData(index)}
                onUpdate={(data) => onUpdateSet(set.id, data)}
                onComplete={() => onCompleteSet(set.id)}
                onRemove={() => onRemoveSet(set.id)}
                isLastSet={index === exercise.sets.length - 1}
              />
            ))}
          </View>

          {/* Add Set Button */}
          <TouchableOpacity style={styles.addSetButton} onPress={handleAddSet}>
            <Ionicons name="add-circle-outline" size={20} color={colors.primary} />
            <Text style={styles.addSetText}>Add Set</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Collapsed Summary */}
      {exercise.isCollapsed && isComplete && (
        <View style={styles.collapsedSummary}>
          <Ionicons name="checkmark-circle" size={16} color={colors.success} />
          <Text style={styles.collapsedText}>
            {totalSets} sets completed
          </Text>
        </View>
      )}
    </GlassCard>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.sm,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    gap: spacing.sm,
  },
  headerInfo: {
    flex: 1,
  },
  exerciseName: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
    color: colors.text,
    marginBottom: 2,
  },
  exerciseNameComplete: {
    color: colors.success,
  },
  setsProgress: {
    fontSize: typography.size.sm,
    color: colors.textSecondary,
  },
  historyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.primaryMuted,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
  },
  historyText: {
    fontSize: typography.size.xs,
    color: colors.primary,
    fontWeight: typography.weight.medium,
  },
  removeButton: {
    padding: spacing.sm,
  },
  removeButtonPressed: {
    opacity: 0.5,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  setsList: {
    gap: spacing.sm,
  },
  addSetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    marginTop: spacing.md,
    backgroundColor: glass.backgroundLight,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: glass.border,
    borderStyle: 'dashed',
  },
  addSetText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
    color: colors.primary,
  },
  collapsedSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: `${colors.success}30`,
  },
  collapsedText: {
    fontSize: typography.size.sm,
    color: colors.success,
    fontWeight: typography.weight.medium,
  },
});

export default ActiveExerciseCard;
