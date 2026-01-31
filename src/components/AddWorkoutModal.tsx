import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Pressable,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { WorkoutLog, ExerciseLog, SetLog, WorkoutTemplate, ExerciseTemplate } from '../types';
import { generateId, saveTemplate, getLastExercisePerformance } from '../services/storage';
import { heavyHaptic, lightHaptic } from '../utils/haptics';
import { colors, glass, radius, spacing, typography, shadows } from '../utils/theme';
import { useUserStore } from '../stores';
import ModalHeader from './ModalHeader';
import GlassButton from './GlassButton';
import ResponsiveModal from './ResponsiveModal';
import NumberInput from './NumberInput';
import { modalStyles, placeholderColor } from '../styles/modalStyles';
import ExercisePicker from './ExercisePicker';
import TemplatePicker from './TemplatePicker';
import RestTimer from './RestTimer';
import WorkoutTimer from './WorkoutTimer';
import ExerciseHistoryIndicator from './ExerciseHistoryIndicator';
import DraggableList, { DragHandle } from './DraggableList';

interface AddWorkoutModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (workout: WorkoutLog) => void;
  date: string;
  userId: string;
  initialTemplate?: WorkoutTemplate | null;
}

const AddWorkoutModal: React.FC<AddWorkoutModalProps> = ({
  visible,
  onClose,
  onSave,
  date,
  userId,
  initialTemplate,
}) => {
  // Get user's preferred weight unit
  const weightUnit = useUserStore((s) => s.user?.preferredWeightUnit) || 'kg';

  const [workoutName, setWorkoutName] = useState('');
  const [exercises, setExercises] = useState<ExerciseLog[]>([]);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  // Current exercise being added
  const [exerciseName, setExerciseName] = useState('');
  const [sets, setSets] = useState('3');
  const [reps, setReps] = useState('10');
  const [weight, setWeight] = useState('');

  // Notes
  const [workoutNotes, setWorkoutNotes] = useState('');
  const [exerciseNotes, setExerciseNotes] = useState('');

  // Exercise history
  const [exerciseHistory, setExerciseHistory] = useState<{
    date: string;
    sets: number;
    reps: number;
    weight: number;
    workoutName: string;
  } | null>(null);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Pickers
  const [showExercisePicker, setShowExercisePicker] = useState(false);
  const [showTemplatePicker, setShowTemplatePicker] = useState(false);
  const [showRestTimer, setShowRestTimer] = useState(false);

  // Workout timer
  const [workoutDuration, setWorkoutDuration] = useState<number>(0);
  const [hasActiveTimer, setHasActiveTimer] = useState(false);

  const handleDurationChange = (durationInMinutes: number) => {
    setWorkoutDuration(durationInMinutes);
    setHasActiveTimer(durationInMinutes > 0);
  };

  // Load initial template
  useEffect(() => {
    if (visible && initialTemplate) {
      setWorkoutName(initialTemplate.name);
      const exerciseLogs: ExerciseLog[] = initialTemplate.exercises.map((exerciseTemplate) => {
        const setsArray: SetLog[] = Array.from({ length: exerciseTemplate.targetSets }, () => ({
          reps: exerciseTemplate.targetReps,
          weight: exerciseTemplate.targetWeight || 0,
          completed: true,
        }));
        return {
          id: generateId(),
          exerciseName: exerciseTemplate.exerciseName,
          sets: setsArray,
        };
      });
      setExercises(exerciseLogs);
    }
  }, [visible, initialTemplate]);

  const handleAddExercise = () => {
    if (!exerciseName.trim()) {
      Alert.alert('Error', 'Please enter an exercise name');
      return;
    }

    const numSets = parseInt(sets) || 3;
    const numReps = parseInt(reps) || 10;
    const numWeight = parseInt(weight) || 0;

    const setsArray: SetLog[] = Array.from({ length: numSets }, () => ({
      reps: numReps,
      weight: numWeight,
      completed: true,
    }));

    const newExercise: ExerciseLog = {
      id: generateId(),
      exerciseName: exerciseName.trim(),
      sets: setsArray,
      notes: exerciseNotes.trim() || undefined,
    };

    setExercises([...exercises, newExercise]);
    setExerciseName('');
    setWeight('');
    setExerciseNotes('');
    setExerciseHistory(null);
    lightHaptic();
  };

  const handleRemoveExercise = (id: string) => {
    setExercises(exercises.filter(ex => ex.id !== id));
  };

  const handleSelectExercise = (name: string, defaults?: { sets: number; reps: number }) => {
    setExerciseName(name);
    if (defaults) {
      setSets(defaults.sets.toString());
      setReps(defaults.reps.toString());
    }
    setShowExercisePicker(false);
    loadExerciseHistory(name);
  };

  const loadExerciseHistory = async (name: string) => {
    if (!name.trim()) {
      setExerciseHistory(null);
      return;
    }
    setLoadingHistory(true);
    const history = await getLastExercisePerformance(name.trim(), userId);
    setExerciseHistory(history);
    setLoadingHistory(false);
  };

  const handleSelectTemplate = (template: WorkoutTemplate) => {
    setWorkoutName(template.name);
    const exerciseLogs: ExerciseLog[] = template.exercises.map((exerciseTemplate) => {
      const setsArray: SetLog[] = Array.from({ length: exerciseTemplate.targetSets }, () => ({
        reps: exerciseTemplate.targetReps,
        weight: exerciseTemplate.targetWeight || 0,
        completed: true,
      }));
      return {
        id: generateId(),
        exerciseName: exerciseTemplate.exerciseName,
        sets: setsArray,
      };
    });
    setExercises(exerciseLogs);
    setShowTemplatePicker(false);
  };

  const handleSaveAsTemplate = async () => {
    if (!workoutName.trim() || exercises.length === 0) {
      Alert.alert('Error', 'Cannot save empty workout as template');
      return;
    }

    Alert.prompt(
      'Save as Template',
      'Enter a name for this template:',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Save',
          onPress: async (templateName?: string) => {
            if (!templateName?.trim()) {
              Alert.alert('Error', 'Please enter a template name');
              return;
            }

            const exerciseTemplates: ExerciseTemplate[] = exercises.map((exercise, index) => ({
              id: generateId(),
              exerciseName: exercise.exerciseName,
              targetSets: exercise.sets.length,
              targetReps: exercise.sets[0]?.reps || 10,
              targetWeight: exercise.sets[0]?.weight > 0 ? exercise.sets[0].weight : undefined,
              order: index,
            }));

            const template: WorkoutTemplate = {
              id: generateId(),
              userId,
              name: templateName.trim(),
              exercises: exerciseTemplates,
              created: new Date().toISOString(),
            };

            await saveTemplate(template);
            Alert.alert('Success', `Template "${templateName}" saved!`);
          },
        },
      ],
      'plain-text',
      workoutName
    );
  };

  const handleSave = () => {
    if (!workoutName.trim()) {
      Alert.alert('Error', 'Please enter a workout name');
      return;
    }
    if (exercises.length === 0) {
      Alert.alert('Error', 'Please add at least one exercise');
      return;
    }

    const workout: WorkoutLog = {
      id: generateId(),
      userId,
      date,
      name: workoutName.trim(),
      duration: workoutDuration > 0 ? Math.round(workoutDuration * 10) / 10 : undefined,
      exercises,
      notes: workoutNotes.trim() || undefined,
      completed: true,
      created: new Date().toISOString(),
    };

    heavyHaptic();
    onSave(workout);
    resetForm();
    onClose();
  };

  const resetForm = () => {
    setWorkoutName('');
    setExercises([]);
    setExerciseName('');
    setSets('3');
    setReps('10');
    setWeight('');
    setWorkoutNotes('');
    setExerciseNotes('');
    setWorkoutDuration(0);
    setHasActiveTimer(false);
  };

  const handleClose = () => {
    if (workoutName || exercises.length > 0 || hasActiveTimer) {
      const message = hasActiveTimer
        ? 'You have an active workout timer. Your progress will be lost if you close.'
        : 'You have unsaved changes. Are you sure you want to close?';

      Alert.alert('Discard Workout?', message, [
        { text: 'Keep Editing', style: 'cancel' },
        { text: 'Discard', style: 'destructive', onPress: () => { resetForm(); onClose(); }},
      ]);
    } else {
      resetForm();
      onClose();
    }
  };

  const TimerAccessory = (
    <View style={styles.timerAccessory}>
      <WorkoutTimer onDurationChange={handleDurationChange} />
      <Pressable
        style={styles.restTimerButton}
        onPress={() => setShowRestTimer(true)}
      >
        <Ionicons name="hourglass-outline" size={18} color={colors.primary} />
      </Pressable>
    </View>
  );

  return (
    <ResponsiveModal
      visible={visible}
      onClose={handleClose}
      size="xl"
      allowFullHeight
    >
      <View style={styles.container}>
        <ModalHeader
          title="Log Workout"
          onCancel={handleClose}
          onSave={handleSave}
          rightAccessory={TimerAccessory}
        />

        <ScrollView
          style={modalStyles.content}
          contentContainerStyle={modalStyles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardDismissMode="on-drag"
        >
          {/* Use Template Button */}
          <View style={styles.templateButtonContainer}>
            <GlassButton
              title="Use Template"
              onPress={() => setShowTemplatePicker(true)}
              variant="ghost"
              icon="document-text"
              fullWidth
            />
          </View>

          {/* Workout Name */}
          <View style={modalStyles.section}>
            <Text style={modalStyles.label}>
              Workout Name <Text style={modalStyles.requiredLabel}>*</Text>
            </Text>
            <TextInput
              style={[
                modalStyles.input,
                focusedField === 'workoutName' && modalStyles.inputFocused,
              ]}
              placeholder="e.g., Push Day, Upper Body"
              placeholderTextColor={placeholderColor}
              value={workoutName}
              onChangeText={setWorkoutName}
              onFocus={() => setFocusedField('workoutName')}
              onBlur={() => setFocusedField(null)}
              autoCapitalize="words"
            />
          </View>

          {/* Workout Notes */}
          <View style={modalStyles.section}>
            <Text style={modalStyles.label}>Workout Notes (Optional)</Text>
            <TextInput
              style={[
                modalStyles.input,
                modalStyles.textArea,
                focusedField === 'workoutNotes' && modalStyles.inputFocused,
              ]}
              placeholder="How did you feel? Any adjustments needed?"
              placeholderTextColor={placeholderColor}
              value={workoutNotes}
              onChangeText={setWorkoutNotes}
              onFocus={() => setFocusedField('workoutNotes')}
              onBlur={() => setFocusedField(null)}
              multiline
              numberOfLines={3}
            />
          </View>

          {/* Exercises List */}
          {exercises.length > 0 && (
            <View style={styles.exercisesSection}>
              <View style={styles.exercisesHeader}>
                <LinearGradient
                  colors={[colors.workoutLight, colors.workout]}
                  style={styles.exercisesIcon}
                >
                  <Ionicons name="barbell" size={18} color={colors.text} />
                </LinearGradient>
                <Text style={modalStyles.sectionTitle}>Exercises ({exercises.length})</Text>
              </View>

              <DraggableList
                items={exercises}
                keyExtractor={(ex) => ex.id}
                onReorder={setExercises}
                renderItem={(exercise, index, dragHandleProps) => (
                  <View style={styles.exerciseItem}>
                    <DragHandle {...dragHandleProps} />
                    <View style={styles.exerciseInfo}>
                      <Text style={styles.exerciseName}>{exercise.exerciseName}</Text>
                      <Text style={styles.exerciseDetails}>
                        {exercise.sets.length} sets × {exercise.sets[0]?.reps} reps
                        {exercise.sets[0]?.weight > 0 && ` @ ${exercise.sets[0].weight} ${weightUnit}`}
                      </Text>
                      {exercise.notes && (
                        <Text style={styles.exerciseNotes}>{exercise.notes}</Text>
                      )}
                    </View>
                    <Pressable
                      onPress={() => handleRemoveExercise(exercise.id)}
                      style={styles.removeButton}
                    >
                      <Ionicons name="close-circle" size={24} color={colors.error} />
                    </Pressable>
                  </View>
                )}
              />
            </View>
          )}

          {/* Add Exercise Form */}
          <View style={styles.addExerciseCard}>
            <View style={styles.addExerciseHeader}>
              <Ionicons name="add-circle" size={22} color={colors.success} />
              <Text style={modalStyles.sectionTitle}>Add Exercise</Text>
            </View>

            {/* Exercise Picker */}
            <Text style={modalStyles.label}>Exercise Name *</Text>
            <Pressable
              style={({ pressed }) => [
                modalStyles.pickerButton,
                pressed && { backgroundColor: glass.background },
              ]}
              onPress={() => setShowExercisePicker(true)}
            >
              <Ionicons name="search" size={20} color={colors.primary} />
              <Text style={[
                modalStyles.pickerButtonText,
                exerciseName && modalStyles.pickerButtonTextSelected,
              ]}>
                {exerciseName || 'Select from exercise database'}
              </Text>
              <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
            </Pressable>

            <Text style={styles.orText}>or enter custom name</Text>

            <TextInput
              style={[
                modalStyles.input,
                focusedField === 'exerciseName' && modalStyles.inputFocused,
              ]}
              placeholder="e.g., Bench Press, Squat"
              placeholderTextColor={placeholderColor}
              value={exerciseName}
              onChangeText={setExerciseName}
              onFocus={() => setFocusedField('exerciseName')}
              onBlur={() => { setFocusedField(null); loadExerciseHistory(exerciseName); }}
              autoCapitalize="words"
            />

            {exerciseName.trim() && (
              <ExerciseHistoryIndicator
                exerciseName={exerciseName}
                lastPerformance={exerciseHistory}
                loading={loadingHistory}
                weightUnit={weightUnit}
                onApplySuggestion={(suggestedSets, suggestedReps, suggestedWeight) => {
                  setSets(suggestedSets.toString());
                  setReps(suggestedReps.toString());
                  setWeight(suggestedWeight > 0 ? suggestedWeight.toString() : '');
                }}
              />
            )}

            {/* Large touch-friendly number inputs with steppers on desktop */}
            <View style={styles.numberInputRow}>
              <NumberInput
                label="Sets"
                value={sets}
                onChangeText={setSets}
                placeholder="3"
                min={1}
                max={20}
                step={1}
                maxLength={2}
                onFocus={() => setFocusedField('sets')}
                onBlur={() => setFocusedField(null)}
                isFocused={focusedField === 'sets'}
                size="large"
              />

              <Text style={styles.numberInputSeparator}>×</Text>

              <NumberInput
                label="Reps"
                value={reps}
                onChangeText={setReps}
                placeholder="10"
                min={1}
                max={100}
                step={1}
                maxLength={3}
                onFocus={() => setFocusedField('reps')}
                onBlur={() => setFocusedField(null)}
                isFocused={focusedField === 'reps'}
                size="large"
              />

              <Text style={styles.numberInputSeparator}>@</Text>

              <View style={{ flex: 1.5 }}>
                <NumberInput
                  label={weightUnit}
                  value={weight}
                  onChangeText={setWeight}
                  placeholder="0"
                  min={0}
                  max={999}
                  step={2.5}
                  allowDecimal
                  maxLength={5}
                  onFocus={() => setFocusedField('weight')}
                  onBlur={() => setFocusedField(null)}
                  isFocused={focusedField === 'weight'}
                  size="large"
                />
              </View>
            </View>

            <View style={{ marginTop: spacing.lg }}>
              <Text style={modalStyles.label}>Exercise Notes (Optional)</Text>
              <TextInput
                style={[
                  modalStyles.input,
                  modalStyles.textArea,
                  { minHeight: 60 },
                  focusedField === 'exerciseNotes' && modalStyles.inputFocused,
                ]}
                placeholder="Form cues, adjustments, etc."
                placeholderTextColor={placeholderColor}
                value={exerciseNotes}
                onChangeText={setExerciseNotes}
                onFocus={() => setFocusedField('exerciseNotes')}
                onBlur={() => setFocusedField(null)}
                multiline
                numberOfLines={2}
              />
            </View>

            <GlassButton
              title="Add Exercise"
              onPress={handleAddExercise}
              variant="success"
              icon="add-circle"
              fullWidth
              style={{ marginTop: spacing.xl }}
            />
          </View>

          {/* Save as Template */}
          {exercises.length > 0 && (
            <View style={styles.saveTemplateContainer}>
              <GlassButton
                title="Save as Template"
                onPress={handleSaveAsTemplate}
                variant="ghost"
                icon="bookmark"
                fullWidth
              />
            </View>
          )}

          {/* Help */}
          <View style={modalStyles.helpSection}>
            <Ionicons name="information-circle" size={20} color={colors.primary} />
            <Text style={modalStyles.helpText}>
              Add exercises one at a time. Each exercise will use the same reps and weight for all sets.
            </Text>
          </View>
        </ScrollView>

      <TemplatePicker
        visible={showTemplatePicker}
        onClose={() => setShowTemplatePicker(false)}
        onSelectTemplate={handleSelectTemplate}
      />

      <ExercisePicker
        visible={showExercisePicker}
        onClose={() => setShowExercisePicker(false)}
        onSelectExercise={handleSelectExercise}
        currentExerciseName={exerciseName}
      />

      <RestTimer
        visible={showRestTimer}
        onClose={() => setShowRestTimer(false)}
      />
      </View>
    </ResponsiveModal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  timerAccessory: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  restTimerButton: {
    padding: spacing.sm,
    backgroundColor: glass.backgroundLight,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: glass.border,
  },
  templateButtonContainer: {
    marginBottom: spacing.xl,
  },
  exercisesSection: {
    marginBottom: spacing.xl,
  },
  exercisesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  exercisesIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  exerciseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: glass.backgroundLight,
    borderWidth: 1,
    borderColor: glass.border,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.sm,
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseName: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
    color: colors.text,
    marginBottom: 4,
  },
  exerciseDetails: {
    fontSize: typography.size.sm,
    color: colors.textSecondary,
  },
  exerciseNotes: {
    fontSize: typography.size.sm,
    color: colors.textTertiary,
    marginTop: 4,
    fontStyle: 'italic',
  },
  removeButton: {
    padding: spacing.xs,
  },
  addExerciseCard: {
    backgroundColor: glass.backgroundLight,
    borderWidth: 1,
    borderColor: glass.border,
    borderRadius: radius.xl,
    padding: spacing.xl,
    marginBottom: spacing.xl,
    ...shadows.sm,
  },
  addExerciseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  orText: {
    fontSize: typography.size.sm,
    color: colors.textTertiary,
    textAlign: 'center',
    marginVertical: spacing.md,
  },
  saveTemplateContainer: {
    marginBottom: spacing.xl,
  },
  // Number input row with separators
  numberInputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
    marginTop: spacing.xl,
  },
  numberInputSeparator: {
    fontSize: typography.size.xl,
    fontWeight: typography.weight.medium,
    color: colors.textTertiary,
    marginBottom: spacing.lg,
  },
});

export default AddWorkoutModal;
