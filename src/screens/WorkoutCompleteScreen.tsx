/**
 * WorkoutCompleteScreen - Step 3 of the new Add Workout flow
 *
 * Shows workout summary, PR achievements, and option to save as template.
 */

import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
} from 'react-native-reanimated';
import { useActiveWorkoutStore, useWorkoutStore, useUserStore, useTemplateStore } from '../stores';
import { WorkoutsStackParamList } from '../navigation/WorkoutsStack';
import { PersonalRecord, WorkoutTemplate, ExerciseTemplate } from '../types';
import { colors, glass, radius, spacing, typography } from '../utils/theme';
import GlassCard from '../components/GlassCard';
import GlassButton from '../components/GlassButton';
import { heavyHaptic, lightHaptic } from '../utils/haptics';
import { generateId } from '../services/storage';
import { DesktopWorkoutOverlayContext } from '../layouts/DesktopLayout';
import { logError } from '../utils/logger';

type NavigationProp = StackNavigationProp<WorkoutsStackParamList, 'WorkoutComplete'>;

const WorkoutCompleteScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const desktopOverlay = useContext(DesktopWorkoutOverlayContext);

  // Stores
  const {
    workoutName,
    exercises,
    getWorkoutDuration,
    getTotalSets,
    getCompletedSets,
    finishWorkout,
    discardWorkout,
  } = useActiveWorkoutStore();

  const addWorkout = useWorkoutStore((s) => s.addWorkout);
  const addTemplate = useTemplateStore((s) => s.addTemplate);
  const userId = useUserStore((s) => s.user?.id) || 'local-user';
  const weightUnit = useUserStore((s) => s.user?.preferredWeightUnit) || 'kg';

  // Local state
  const [_newPRs, setNewPRs] = useState<PersonalRecord[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [saveAsTemplate, setSaveAsTemplate] = useState(false);
  const [templateName, setTemplateName] = useState(workoutName);

  // Animation values
  const iconScale = useSharedValue(0);
  const contentOpacity = useSharedValue(0);

  useEffect(() => {
    iconScale.value = withSpring(1, { damping: 10, stiffness: 100 });
    contentOpacity.value = withDelay(300, withSpring(1));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const iconAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: iconScale.value }],
  }));

  const contentAnimatedStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
  }));

  // Calculate stats
  const duration = getWorkoutDuration();
  const totalSets = getTotalSets();
  const completedSets = getCompletedSets();
  const totalExercises = exercises.length;

  // Calculate total volume
  const totalVolume = exercises.reduce((total, exercise) => {
    return (
      total +
      exercise.sets.reduce((setTotal, set) => {
        if (set.completed) {
          return setTotal + set.weight * set.reps;
        }
        return setTotal;
      }, 0)
    );
  }, 0);

  // Format time as HH:MM:SS or MM:SS
  const formatDuration = (totalSeconds: number): string => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = Math.floor(totalSeconds % 60);

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const formatVolume = (volume: number): string => {
    if (volume >= 1000) {
      return `${(volume / 1000).toFixed(1)}k ${weightUnit}`;
    }
    return `${Math.round(volume)} ${weightUnit}`;
  };

  // Helper to navigate back (handles both mobile and desktop)
  const navigateBack = () => {
    if (desktopOverlay) {
      desktopOverlay.closeWorkoutFlow();
    } else {
      navigation.navigate('WorkoutsList');
    }
  };

  const handleSaveWorkout = async () => {
    if (isSaving) return;

    setIsSaving(true);
    heavyHaptic();

    try {
      // Get the final workout log
      const workoutLog = finishWorkout();

      // Save to storage and check for PRs
      const prs = await addWorkout(workoutLog);
      setNewPRs(prs);

      // Save as template if requested
      if (saveAsTemplate && templateName.trim()) {
        const exerciseTemplates: ExerciseTemplate[] = workoutLog.exercises.map(
          (exercise, index) => ({
            id: generateId(),
            exerciseName: exercise.exerciseName,
            targetSets: exercise.sets.length,
            targetReps: exercise.sets[0]?.reps || 10,
            targetWeight: exercise.sets[0]?.weight || undefined,
            order: index,
          })
        );

        const template: WorkoutTemplate = {
          id: generateId(),
          userId,
          name: templateName.trim(),
          exercises: exerciseTemplates,
          created: new Date().toISOString(),
        };

        await addTemplate(template);
      }

      // Show PR celebration if any
      if (prs.length > 0) {
        Alert.alert(
          '🏆 New Personal Records!',
          prs.map((pr) => `${pr.exerciseName}: ${pr.weight} ${weightUnit} × ${pr.reps}`).join('\n'),
          [
            {
              text: 'Awesome!',
              onPress: navigateBack,
            },
          ]
        );
      } else {
        // Navigate back to workout list
        navigateBack();
      }
    } catch (error) {
      logError('Failed to save workout', error);
      Alert.alert('Error', 'Failed to save workout. Please try again.');
      setIsSaving(false);
    }
  };

  const handleDiscard = () => {
    Alert.alert(
      'Discard Workout?',
      'Your workout will not be saved. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Discard',
          style: 'destructive',
          onPress: () => {
            discardWorkout();
            navigateBack();
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Success Header */}
        <Animated.View style={[styles.successHeader, iconAnimatedStyle]}>
          <LinearGradient
            colors={[colors.successMuted, 'transparent']}
            style={styles.successGradient}
          >
            <View style={styles.successIcon}>
              <Ionicons name="checkmark-circle" size={72} color={colors.success} />
            </View>
            <Text style={styles.successTitle}>Great Workout!</Text>
            <Text style={styles.successSubtitle}>
              {workoutName || 'Workout'} completed
            </Text>
          </LinearGradient>
        </Animated.View>

        {/* Stats Card */}
        <Animated.View style={contentAnimatedStyle}>
          <GlassCard style={styles.statsCard}>
            <Text style={styles.statsTitle}>Summary</Text>

            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Ionicons name="time-outline" size={24} color={colors.primary} />
                <Text style={styles.statValue}>{formatDuration(duration)}</Text>
                <Text style={styles.statLabel}>Duration</Text>
              </View>

              <View style={styles.statItem}>
                <Ionicons name="barbell-outline" size={24} color={colors.workout} />
                <Text style={styles.statValue}>{totalExercises}</Text>
                <Text style={styles.statLabel}>Exercises</Text>
              </View>

              <View style={styles.statItem}>
                <Ionicons name="checkmark-done-outline" size={24} color={colors.success} />
                <Text style={styles.statValue}>
                  {completedSets}/{totalSets}
                </Text>
                <Text style={styles.statLabel}>Sets</Text>
              </View>

              <View style={styles.statItem}>
                <Ionicons name="trending-up-outline" size={24} color={colors.primary} />
                <Text style={styles.statValue}>{formatVolume(totalVolume)}</Text>
                <Text style={styles.statLabel}>Volume</Text>
              </View>
            </View>
          </GlassCard>

          {/* Exercises Summary */}
          <GlassCard style={styles.exercisesCard}>
            <Text style={styles.statsTitle}>Exercises</Text>
            {exercises.map((exercise) => {
              const completedInExercise = exercise.sets.filter((s) => s.completed).length;
              return (
                <View key={exercise.id} style={styles.exerciseSummaryItem}>
                  <View style={styles.exerciseSummaryInfo}>
                    <Text style={styles.exerciseSummaryName}>{exercise.exerciseName}</Text>
                    <Text style={styles.exerciseSummaryDetail}>
                      {completedInExercise}/{exercise.sets.length} sets completed
                    </Text>
                  </View>
                  {completedInExercise === exercise.sets.length ? (
                    <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                  ) : (
                    <Ionicons name="ellipse-outline" size={20} color={colors.textTertiary} />
                  )}
                </View>
              );
            })}
          </GlassCard>

          {/* Save as Template Option */}
          <GlassCard style={styles.templateCard}>
            <View style={styles.templateToggle}>
              <TouchableOpacity
                style={[styles.checkbox, saveAsTemplate && styles.checkboxChecked]}
                onPress={() => {
                  lightHaptic();
                  setSaveAsTemplate(!saveAsTemplate);
                }}
              >
                {saveAsTemplate && (
                  <Ionicons name="checkmark" size={16} color={colors.text} />
                )}
              </TouchableOpacity>
              <Text style={styles.templateToggleLabel}>Save as template for next time</Text>
            </View>

            {saveAsTemplate && (
              <TextInput
                style={styles.templateNameInput}
                value={templateName}
                onChangeText={setTemplateName}
                placeholder="Template name"
                placeholderTextColor={colors.textTertiary}
              />
            )}
          </GlassCard>

          {/* Actions */}
          <View style={styles.actions}>
            <GlassButton
              title={isSaving ? 'Saving...' : 'Save Workout'}
              onPress={handleSaveWorkout}
              variant="success"
              icon="checkmark-circle"
              size="lg"
              fullWidth
              disabled={isSaving}
            />

            <GlassButton
              title="Discard"
              onPress={handleDiscard}
              variant="ghost"
              size="lg"
              fullWidth
              disabled={isSaving}
            />
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
};

// Import TouchableOpacity for the checkbox
import { TouchableOpacity } from 'react-native';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    // Web fix: use absolute positioning to ensure scroll works
    ...(Platform.OS === 'web' ? {
      position: 'absolute' as const,
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
    } : {}),
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.xl,
    paddingBottom: 120,
  },
  successHeader: {
    marginBottom: spacing.xl,
  },
  successGradient: {
    alignItems: 'center',
    paddingVertical: spacing['3xl'],
    borderRadius: radius.xl,
  },
  successIcon: {
    marginBottom: spacing.lg,
  },
  successTitle: {
    fontSize: typography.size['3xl'],
    fontWeight: typography.weight.bold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  successSubtitle: {
    fontSize: typography.size.base,
    color: colors.textSecondary,
  },
  statsCard: {
    marginBottom: spacing.lg,
    padding: spacing.xl,
  },
  statsTitle: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.semibold,
    color: colors.text,
    marginBottom: spacing.lg,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.lg,
  },
  statItem: {
    flex: 1,
    minWidth: '40%',
    alignItems: 'center',
    backgroundColor: glass.backgroundLight,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: glass.border,
  },
  statValue: {
    fontSize: typography.size.xl,
    fontWeight: typography.weight.bold,
    color: colors.text,
    marginTop: spacing.sm,
  },
  statLabel: {
    fontSize: typography.size.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  exercisesCard: {
    marginBottom: spacing.lg,
    padding: spacing.xl,
  },
  exerciseSummaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: glass.border,
  },
  exerciseSummaryInfo: {
    flex: 1,
  },
  exerciseSummaryName: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
    color: colors.text,
    marginBottom: 2,
  },
  exerciseSummaryDetail: {
    fontSize: typography.size.sm,
    color: colors.textSecondary,
  },
  templateCard: {
    marginBottom: spacing.xl,
    padding: spacing.xl,
  },
  templateToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: radius.sm,
    borderWidth: 2,
    borderColor: colors.textTertiary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  templateToggleLabel: {
    fontSize: typography.size.base,
    color: colors.text,
    flex: 1,
  },
  templateNameInput: {
    marginTop: spacing.lg,
    backgroundColor: glass.backgroundLight,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: glass.border,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontSize: typography.size.base,
    color: colors.text,
  },
  actions: {
    gap: spacing.md,
  },
});

export default WorkoutCompleteScreen;
