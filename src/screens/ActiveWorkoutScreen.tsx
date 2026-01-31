/**
 * ActiveWorkoutScreen - Step 2 of the new Add Workout flow
 *
 * Main workout logging screen with set-level tracking, auto-timers,
 * and inline exercise search.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  Vibration,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useActiveWorkoutStore } from '../stores';
import { WorkoutsStackParamList } from '../navigation/WorkoutsStack';
import { colors, glass, radius, spacing, typography } from '../utils/theme';
import GlassButton from '../components/GlassButton';
import ActiveExerciseCard from '../components/ActiveExerciseCard';
import InlineExerciseSearch from '../components/InlineExerciseSearch';
import { lightHaptic, heavyHaptic } from '../utils/haptics';
import { useUserStore } from '../stores';

type NavigationProp = StackNavigationProp<WorkoutsStackParamList, 'ActiveWorkout'>;
type ActiveWorkoutRouteProp = RouteProp<WorkoutsStackParamList, 'ActiveWorkout'>;

const ActiveWorkoutScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<ActiveWorkoutRouteProp>();
  const scrollViewRef = useRef<ScrollView>(null);

  // User preferences
  const weightUnit = useUserStore((s) => s.user?.preferredWeightUnit) || 'kg';

  // Active workout state
  const {
    hasActiveWorkout,
    workoutName,
    exercises,
    setWorkoutName,
    addExercise,
    removeExercise,
    reorderExercises,
    toggleExerciseCollapse,
    updateExerciseNotes,
    addSet,
    removeSet,
    updateSet,
    completeSet,
    discardWorkout,
    getWorkoutDuration,
    getTotalSets,
    getCompletedSets,
    startTime,
    isWorkoutTimerRunning,
    restTimerEndTime,
    isRestTimerRunning,
    stopRestTimer,
    restTimerDuration,
    getExerciseHistory,
  } = useActiveWorkoutStore();

  // Local state
  const [displayDuration, setDisplayDuration] = useState(0);
  const [restTimeRemaining, setRestTimeRemaining] = useState(0);
  const [isEditingName, setIsEditingName] = useState(false);
  const [showExerciseSearch, setShowExerciseSearch] = useState(false);

  // Update workout timer display
  useEffect(() => {
    if (!isWorkoutTimerRunning) return;

    const interval = setInterval(() => {
      setDisplayDuration(getWorkoutDuration());
    }, 1000);

    return () => clearInterval(interval);
  }, [isWorkoutTimerRunning, getWorkoutDuration]);

  // Update rest timer display
  useEffect(() => {
    if (!isRestTimerRunning || !restTimerEndTime) {
      setRestTimeRemaining(0);
      return;
    }

    const updateRestTimer = () => {
      const remaining = Math.max(0, Math.ceil((restTimerEndTime - Date.now()) / 1000));
      setRestTimeRemaining(remaining);

      if (remaining === 0) {
        // Timer complete
        Vibration.vibrate([0, 200, 100, 200, 100, 400]);
        stopRestTimer();
      }
    };

    updateRestTimer();
    const interval = setInterval(updateRestTimer, 1000);

    return () => clearInterval(interval);
  }, [isRestTimerRunning, restTimerEndTime, stopRestTimer]);

  // Format time as MM:SS
  const formatTime = (totalSeconds: number): string => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = Math.floor(totalSeconds % 60);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleDiscard = () => {
    Alert.alert(
      'Discard Workout?',
      'Your progress will be lost. Are you sure?',
      [
        { text: 'Keep Going', style: 'cancel' },
        {
          text: 'Discard',
          style: 'destructive',
          onPress: () => {
            discardWorkout();
            navigation.goBack();
          },
        },
      ]
    );
  };

  const handleFinish = () => {
    if (exercises.length === 0) {
      Alert.alert('No Exercises', 'Add at least one exercise before finishing.');
      return;
    }

    const completedSets = getCompletedSets();
    if (completedSets === 0) {
      Alert.alert(
        'No Completed Sets',
        'Complete at least one set before finishing, or discard this workout.',
        [{ text: 'OK' }]
      );
      return;
    }

    heavyHaptic();
    navigation.navigate('WorkoutComplete');
  };

  const handleAddExercise = (
    exerciseName: string,
    defaults?: { sets: number; reps: number }
  ) => {
    lightHaptic();
    addExercise(exerciseName, defaults);
    setShowExerciseSearch(false);

    // Scroll to bottom after adding
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const handleCompleteSet = (exerciseId: string, setId: string) => {
    lightHaptic();
    completeSet(exerciseId, setId);
  };

  // If no active workout, show error
  if (!hasActiveWorkout) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="warning" size={48} color={colors.warning} />
          <Text style={styles.errorText}>No active workout</Text>
          <GlassButton
            title="Go Back"
            onPress={() => navigation.goBack()}
            variant="primary"
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.discardButton} onPress={handleDiscard}>
            <Ionicons name="close" size={24} color={colors.error} />
          </TouchableOpacity>

          {isEditingName ? (
            <TextInput
              style={styles.workoutNameInput}
              value={workoutName}
              onChangeText={setWorkoutName}
              onBlur={() => setIsEditingName(false)}
              onSubmitEditing={() => setIsEditingName(false)}
              placeholder="Workout Name"
              placeholderTextColor={colors.textTertiary}
              autoFocus
              selectTextOnFocus
            />
          ) : (
            <TouchableOpacity
              style={styles.workoutNameContainer}
              onPress={() => setIsEditingName(true)}
            >
              <Text style={styles.workoutName} numberOfLines={1}>
                {workoutName || 'Untitled Workout'}
              </Text>
              <Ionicons name="pencil" size={16} color={colors.textTertiary} />
            </TouchableOpacity>
          )}

          <TouchableOpacity style={styles.finishButton} onPress={handleFinish}>
            <Text style={styles.finishButtonText}>Finish</Text>
          </TouchableOpacity>
        </View>

        {/* Timer Bar */}
        <View style={styles.timerBar}>
          <View style={styles.timerItem}>
            <Ionicons name="time-outline" size={18} color={colors.primary} />
            <Text style={styles.timerText}>{formatTime(displayDuration)}</Text>
          </View>

          {isRestTimerRunning && restTimeRemaining > 0 && (
            <TouchableOpacity
              style={styles.restTimerContainer}
              onPress={stopRestTimer}
            >
              <Ionicons name="hourglass" size={16} color={colors.warning} />
              <Text style={styles.restTimerText}>
                Rest: {formatTime(restTimeRemaining)}
              </Text>
              <Ionicons name="close-circle" size={16} color={colors.textTertiary} />
            </TouchableOpacity>
          )}

          <View style={styles.setsCounter}>
            <Text style={styles.setsCounterText}>
              {getCompletedSets()}/{getTotalSets()} sets
            </Text>
          </View>
        </View>

        {/* Exercise List */}
        <ScrollView
          ref={scrollViewRef}
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {exercises.map((exercise, index) => (
            <ActiveExerciseCard
              key={exercise.id}
              exercise={exercise}
              weightUnit={weightUnit}
              onUpdateSet={(setId, data) => updateSet(exercise.id, setId, data)}
              onCompleteSet={(setId) => handleCompleteSet(exercise.id, setId)}
              onAddSet={() => addSet(exercise.id)}
              onRemoveSet={(setId) => removeSet(exercise.id, setId)}
              onRemoveExercise={() => removeExercise(exercise.id)}
              onToggleCollapse={() => toggleExerciseCollapse(exercise.id)}
              onUpdateNotes={(notes) => updateExerciseNotes(exercise.id, notes)}
              getExerciseHistory={getExerciseHistory}
            />
          ))}

          {/* Add Exercise Section */}
          <InlineExerciseSearch
            onSelectExercise={handleAddExercise}
            existingExercises={exercises.map((e) => e.exerciseName)}
          />

          {/* Bottom spacing */}
          <View style={styles.bottomSpacer} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardAvoid: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: glass.border,
    backgroundColor: colors.surface,
  },
  discardButton: {
    padding: spacing.sm,
    marginRight: spacing.sm,
  },
  workoutNameContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  workoutName: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.bold,
    color: colors.text,
    flex: 1,
  },
  workoutNameInput: {
    flex: 1,
    fontSize: typography.size.lg,
    fontWeight: typography.weight.bold,
    color: colors.text,
    backgroundColor: glass.backgroundLight,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  finishButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    marginLeft: spacing.sm,
  },
  finishButtonText: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.bold,
    color: colors.text,
  },
  timerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: glass.backgroundDark,
    borderBottomWidth: 1,
    borderBottomColor: glass.border,
    gap: spacing.lg,
  },
  timerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  timerText: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.bold,
    color: colors.primary,
    fontVariant: ['tabular-nums'],
  },
  restTimerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.warningMuted,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: `${colors.warning}40`,
  },
  restTimerText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
    color: colors.warning,
    fontVariant: ['tabular-nums'],
  },
  setsCounter: {
    marginLeft: 'auto',
  },
  setsCounterText: {
    fontSize: typography.size.sm,
    color: colors.textSecondary,
    fontWeight: typography.weight.medium,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  bottomSpacer: {
    height: spacing['4xl'],
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
  },
  errorText: {
    fontSize: typography.size.lg,
    color: colors.textSecondary,
  },
});

export default ActiveWorkoutScreen;
