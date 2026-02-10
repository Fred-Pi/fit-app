/**
 * WorkoutDetailScreen
 *
 * v0.2.0 UX: Clean read-only view of a completed workout with:
 * - PR indicators for exercises where records were set
 * - Comparison to previous performance (if available)
 * - Glass morphism design for visual consistency
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import GlassCard from '../components/GlassCard';
import ConfirmDialog from '../components/ConfirmDialog';
import EditWorkoutModal from '../components/EditWorkoutModal';
import { WorkoutLog, User } from '../types'
import { colors, glass, spacing, typography, radius } from '../utils/theme';
import { getWorkouts, saveWorkout, deleteWorkout, getUser, checkAndUpdatePRs } from '../services/storage';
import { useActiveWorkoutStore, usePersonalRecordStore } from '../stores';
import { StackNavigationProp } from '@react-navigation/stack';
import { WorkoutsStackParamList } from '../navigation/WorkoutsStack';
import { successHaptic, lightHaptic } from '../utils/haptics';
import { useAuthStore } from '../stores/authStore';
import { useResponsive } from '../hooks/useResponsive';
import { logError } from '../utils/logger';

type WorkoutDetailRouteProp = RouteProp<{ params: { workoutId: string } }, 'params'>;

const WorkoutDetailScreen = () => {
  const navigation = useNavigation();
  const route = useRoute<WorkoutDetailRouteProp>();
  const { workoutId } = route.params;
  const { contentMaxWidth } = useResponsive();

  const [workout, setWorkout] = useState<WorkoutLog | null>(null);
  const [allWorkouts, setAllWorkouts] = useState<WorkoutLog[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const startFromRecent = useActiveWorkoutStore((s) => s.startFromRecent);
  const personalRecords = usePersonalRecordStore((s) => s.personalRecords);

  useEffect(() => {
    loadWorkout();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workoutId]);

  const loadWorkout = async () => {
    try {
      const userData = await getUser();
      setUser(userData);

      const userId = useAuthStore.getState().user?.id;
      if (!userId) {
        setLoading(false);
        return;
      }

      const workouts = await getWorkouts(userId);
      setAllWorkouts(workouts);
      const foundWorkout = workouts.find(w => w.id === workoutId);
      setWorkout(foundWorkout || null);
    } catch (error) {
      logError('Error loading workout', error);
    } finally {
      setLoading(false);
    }
  };

  // Find PRs set during this workout (by date match)
  const workoutPRs = useMemo(() => {
    if (!workout) return new Set<string>();
    const workoutDate = workout.date.split('T')[0];
    return new Set(
      personalRecords
        .filter(pr => pr.date.split('T')[0] === workoutDate)
        .map(pr => pr.exerciseName.toLowerCase())
    );
  }, [workout, personalRecords]);

  // Find previous instance of same workout name for comparison
  const previousWorkout = useMemo(() => {
    if (!workout) return null;
    return allWorkouts
      .filter(w => w.id !== workout.id && w.name === workout.name && w.date < workout.date)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0] || null;
  }, [workout, allWorkouts]);

  // Get previous performance for an exercise
  const getPreviousExercise = (exerciseName: string) => {
    if (!previousWorkout) return null;
    return previousWorkout.exercises.find(
      e => e.exerciseName.toLowerCase() === exerciseName.toLowerCase()
    );
  };

  const handleEdit = async (editedWorkout: WorkoutLog) => {
    await saveWorkout(editedWorkout);

    // Check for new PRs
    const newPRs = await checkAndUpdatePRs(editedWorkout);

    setWorkout(editedWorkout);
    setShowEditModal(false);

    // Show PR notification if any were set
    if (newPRs.length > 0) {
      const prNames = newPRs.map(pr => pr.exerciseName).join(', ');
      Alert.alert(
        '🏆 New Personal Record!',
        `Congratulations! You set a new PR for: ${prNames}`,
        [{ text: 'Awesome!', style: 'default' }]
      );
    }
  };

  const handleDelete = async () => {
    await deleteWorkout(workoutId);
    setShowDeleteDialog(false);
    navigation.goBack();
  };

  const handleDuplicate = () => {
    if (!workout) return;

    successHaptic();
    startFromRecent(workout);
    (navigation as StackNavigationProp<WorkoutsStackParamList>).navigate('ActiveWorkout', {
      repeatWorkoutId: workout.id,
    });
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (!workout) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="barbell-outline" size={64} color={colors.textTertiary} />
        <Text style={styles.emptyText}>Workout not found</Text>
      </View>
    );
  }

  const formattedDate = new Date(workout.date).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  const totalSets = workout.exercises.reduce((sum, ex) => sum + ex.sets.length, 0);
  const totalVolume = workout.exercises.reduce(
    (sum, ex) => sum + ex.sets.reduce((setSum, s) => setSum + (s.weight * s.reps), 0),
    0
  );
  const hasPRs = workoutPRs.size > 0;

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.contentContainer,
          { maxWidth: contentMaxWidth, alignSelf: 'center', width: '100%' }
        ]}
      >
        {/* Header Card */}
        <GlassCard accent={hasPRs ? 'gold' : 'blue'} glowIntensity={hasPRs ? 'medium' : 'subtle'}>
          <View style={styles.header}>
            <View style={styles.headerContent}>
              <View style={styles.headerTop}>
                <Text style={styles.workoutName}>{workout.name}</Text>
                {hasPRs && (
                  <View style={styles.prBadge}>
                    <Ionicons name="trophy" size={14} color={colors.gold} />
                    <Text style={styles.prBadgeText}>PR</Text>
                  </View>
                )}
              </View>
              <Text style={styles.workoutDate}>{formattedDate}</Text>
            </View>
            <View style={styles.headerActions}>
              <TouchableOpacity
                style={styles.headerButton}
                onPress={() => { lightHaptic(); handleDuplicate(); }}
                accessibilityLabel="Duplicate workout"
              >
                <Ionicons name="copy" size={20} color={colors.success} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.headerButton}
                onPress={() => { lightHaptic(); setShowEditModal(true); }}
                accessibilityLabel="Edit workout"
              >
                <Ionicons name="pencil" size={20} color={colors.primary} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.headerButton}
                onPress={() => { lightHaptic(); setShowDeleteDialog(true); }}
                accessibilityLabel="Delete workout"
              >
                <Ionicons name="trash" size={20} color={colors.error} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Stats Row */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{workout.exercises.length}</Text>
              <Text style={styles.statLabel}>exercises</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{totalSets}</Text>
              <Text style={styles.statLabel}>sets</Text>
            </View>
            {workout.duration && (
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{Math.round(workout.duration)}</Text>
                <Text style={styles.statLabel}>min</Text>
              </View>
            )}
            {totalVolume > 0 && (
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{(totalVolume / 1000).toFixed(1)}k</Text>
                <Text style={styles.statLabel}>{user?.preferredWeightUnit || 'lbs'}</Text>
              </View>
            )}
          </View>

          {workout.completed && (
            <View style={styles.completedBadge}>
              <Ionicons name="checkmark-circle" size={16} color={colors.success} />
              <Text style={styles.completedText}>Completed</Text>
            </View>
          )}
        </GlassCard>

        {/* Previous Comparison (if available) */}
        {previousWorkout && (
          <View style={styles.comparisonBanner}>
            <Ionicons name="git-compare-outline" size={16} color={colors.textSecondary} />
            <Text style={styles.comparisonText}>
              vs {new Date(previousWorkout.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </Text>
          </View>
        )}

        {/* Exercises */}
        {workout.exercises.map((exercise, index) => {
          const isPR = workoutPRs.has(exercise.exerciseName.toLowerCase());
          const prevExercise = getPreviousExercise(exercise.exerciseName);
          const prevBestWeight = prevExercise
            ? Math.max(...prevExercise.sets.map(s => s.weight))
            : null;
          const currentBestWeight = Math.max(...exercise.sets.map(s => s.weight));
          const weightDiff = prevBestWeight !== null ? currentBestWeight - prevBestWeight : null;

          return (
            <GlassCard
              key={exercise.id}
              accent={isPR ? 'gold' : 'none'}
              glowIntensity={isPR ? 'subtle' : 'none'}
            >
              <View style={styles.exerciseHeader}>
                <View style={[styles.exerciseNumber, isPR && styles.exerciseNumberPR]}>
                  {isPR ? (
                    <Ionicons name="trophy" size={14} color={colors.gold} />
                  ) : (
                    <Text style={styles.exerciseNumberText}>{index + 1}</Text>
                  )}
                </View>
                <View style={styles.exerciseInfo}>
                  <Text style={styles.exerciseName}>{exercise.exerciseName}</Text>
                  {isPR && <Text style={styles.prLabel}>Personal Record</Text>}
                </View>
                {weightDiff !== null && weightDiff !== 0 && (
                  <View style={[
                    styles.diffBadge,
                    weightDiff > 0 ? styles.diffBadgeUp : styles.diffBadgeDown
                  ]}>
                    <Ionicons
                      name={weightDiff > 0 ? 'arrow-up' : 'arrow-down'}
                      size={12}
                      color={weightDiff > 0 ? colors.success : colors.error}
                    />
                    <Text style={[
                      styles.diffText,
                      { color: weightDiff > 0 ? colors.success : colors.error }
                    ]}>
                      {Math.abs(weightDiff)} {user?.preferredWeightUnit || 'lbs'}
                    </Text>
                  </View>
                )}
              </View>

              <View style={styles.setsContainer}>
                {exercise.sets.map((set, setIndex) => (
                  <View key={setIndex} style={styles.setRow}>
                    <Text style={styles.setNumber}>{setIndex + 1}</Text>
                    <Text style={styles.setWeight}>
                      {set.weight > 0 ? `${set.weight} ${user?.preferredWeightUnit || 'lbs'}` : 'BW'}
                    </Text>
                    <Text style={styles.setSeparator}>×</Text>
                    <Text style={styles.setReps}>{set.reps}</Text>
                    {set.completed && (
                      <Ionicons name="checkmark" size={16} color={colors.success} style={styles.setCheck} />
                    )}
                  </View>
                ))}
              </View>

              {exercise.notes && (
                <View style={styles.exerciseNotes}>
                  <Text style={styles.exerciseNotesText}>{exercise.notes}</Text>
                </View>
              )}
            </GlassCard>
          );
        })}

        {/* Notes */}
        {workout.notes && (
          <GlassCard accent="none" glowIntensity="none">
            <View style={styles.notesHeader}>
              <Ionicons name="document-text-outline" size={18} color={colors.textSecondary} />
              <Text style={styles.notesLabel}>Notes</Text>
            </View>
            <Text style={styles.notesText}>{workout.notes}</Text>
          </GlassCard>
        )}
      </ScrollView>

      {showEditModal && (
        <EditWorkoutModal
          visible={showEditModal}
          onClose={() => setShowEditModal(false)}
          onSave={handleEdit}
          workout={workout}
        />
      )}

      <ConfirmDialog
        visible={showDeleteDialog}
        title="Delete Workout?"
        message={`Are you sure you want to delete "${workout.name}"? This cannot be undone.`}
        confirmText="Delete"
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteDialog(false)}
        icon="barbell"
        iconColor="#FF3B30"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    fontSize: typography.size.base,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
  emptyText: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.semibold,
    color: colors.textSecondary,
    marginTop: spacing.lg,
  },
  contentContainer: {
    padding: spacing.xl,
    paddingBottom: spacing['4xl'],
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.lg,
  },
  headerContent: {
    flex: 1,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  workoutName: {
    fontSize: typography.size['2xl'],
    fontWeight: typography.weight.bold,
    color: colors.text,
    letterSpacing: -0.3,
  },
  workoutDate: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
    color: colors.textSecondary,
  },
  prBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.goldMuted,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.md,
  },
  prBadgeText: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.bold,
    color: colors.gold,
  },
  headerActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  headerButton: {
    padding: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: glass.backgroundLight,
  },

  // Stats Row
  statsRow: {
    flexDirection: 'row',
    gap: spacing.lg,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: glass.border,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: typography.size.xl,
    fontWeight: typography.weight.bold,
    color: colors.text,
  },
  statLabel: {
    fontSize: typography.size.xs,
    color: colors.textSecondary,
    fontWeight: typography.weight.medium,
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.md,
  },
  completedText: {
    fontSize: typography.size.sm,
    color: colors.success,
    fontWeight: typography.weight.medium,
  },

  // Comparison Banner
  comparisonBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: glass.background,
    borderRadius: radius.md,
    marginBottom: spacing.md,
    alignSelf: 'flex-start',
  },
  comparisonText: {
    fontSize: typography.size.sm,
    color: colors.textSecondary,
  },

  // Exercise Card
  exerciseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    gap: spacing.md,
  },
  exerciseNumber: {
    width: 28,
    height: 28,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  exerciseNumberPR: {
    backgroundColor: colors.goldMuted,
  },
  exerciseNumberText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.bold,
    color: colors.text,
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseName: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.semibold,
    color: colors.text,
  },
  prLabel: {
    fontSize: typography.size.xs,
    color: colors.gold,
    fontWeight: typography.weight.medium,
    marginTop: 2,
  },
  diffBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.md,
  },
  diffBadgeUp: {
    backgroundColor: colors.successMuted,
  },
  diffBadgeDown: {
    backgroundColor: colors.errorMuted,
  },
  diffText: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.semibold,
  },

  // Sets
  setsContainer: {
    gap: spacing.sm,
  },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: glass.backgroundLight,
    borderRadius: radius.md,
  },
  setNumber: {
    width: 24,
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
    color: colors.textTertiary,
  },
  setWeight: {
    flex: 1,
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
    color: colors.text,
  },
  setSeparator: {
    fontSize: typography.size.sm,
    color: colors.textTertiary,
    marginHorizontal: spacing.xs,
  },
  setReps: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.bold,
    color: colors.primary,
    minWidth: 30,
  },
  setCheck: {
    marginLeft: spacing.sm,
  },

  // Notes
  exerciseNotes: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: glass.border,
  },
  exerciseNotesText: {
    fontSize: typography.size.sm,
    color: colors.textSecondary,
    fontStyle: 'italic',
    lineHeight: 20,
  },
  notesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  notesLabel: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
    color: colors.textSecondary,
  },
  notesText: {
    fontSize: typography.size.base,
    color: colors.text,
    lineHeight: 22,
  },
});

export default WorkoutDetailScreen;
