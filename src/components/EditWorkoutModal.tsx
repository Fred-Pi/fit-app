import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { WorkoutLog, ExerciseLog, SetLog } from '../types';
import { generateId, getLastExercisePerformance } from '../services/storage';
import ExercisePicker from './ExercisePicker';
import ExerciseHistoryIndicator from './ExerciseHistoryIndicator';

interface EditWorkoutModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (workout: WorkoutLog) => void;
  workout: WorkoutLog | null;
}

const EditWorkoutModal: React.FC<EditWorkoutModalProps> = ({
  visible,
  onClose,
  onSave,
  workout,
}) => {
  const [workoutName, setWorkoutName] = useState('');
  const [exercises, setExercises] = useState<ExerciseLog[]>([]);

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

  // Exercise picker
  const [showExercisePicker, setShowExercisePicker] = useState(false);

  useEffect(() => {
    if (workout) {
      setWorkoutName(workout.name);
      setExercises(workout.exercises);
      setWorkoutNotes(workout.notes || '');
    }
  }, [workout, visible]);

  const handleAddExercise = () => {
    if (!exerciseName.trim()) {
      Alert.alert('Error', 'Please enter an exercise name');
      return;
    }

    const numSets = parseInt(sets) || 3;
    const numReps = parseInt(reps) || 10;
    const numWeight = parseInt(weight) || 0;

    // Create sets array
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

    // Reset exercise form
    setExerciseName('');
    setWeight('');
    setExerciseNotes('');
    setExerciseHistory(null);
    Alert.alert('Success', `${exerciseName} added to workout`);
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
    if (!name.trim() || !workout) {
      setExerciseHistory(null);
      return;
    }

    setLoadingHistory(true);
    const history = await getLastExercisePerformance(name.trim(), workout.userId, workout.id);
    setExerciseHistory(history);
    setLoadingHistory(false);
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

    if (!workout) return;

    const updatedWorkout: WorkoutLog = {
      ...workout,
      name: workoutName.trim(),
      exercises,
      notes: workoutNotes.trim() || undefined,
    };

    onSave(updatedWorkout);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.cancelButton}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Edit Workout</Text>
          <TouchableOpacity onPress={handleSave}>
            <Text style={styles.saveButton}>Save</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Workout Name */}
          <View style={styles.section}>
            <Text style={styles.label}>Workout Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Push Day, Upper Body"
              placeholderTextColor="#98989D"
              value={workoutName}
              onChangeText={setWorkoutName}
              autoCapitalize="words"
            />
          </View>

          {/* Workout Notes */}
          <View style={styles.section}>
            <Text style={styles.label}>Workout Notes (Optional)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="How did you feel? Any adjustments needed?"
              placeholderTextColor="#98989D"
              value={workoutNotes}
              onChangeText={setWorkoutNotes}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>

          {/* Exercises Added */}
          {exercises.length > 0 && (
            <View style={styles.exercisesList}>
              <Text style={styles.sectionTitle}>
                Exercises ({exercises.length})
              </Text>
              {exercises.map((exercise) => (
                <View key={exercise.id} style={styles.exerciseItem}>
                  <View style={styles.exerciseInfo}>
                    <Text style={styles.exerciseItemName}>
                      {exercise.exerciseName}
                    </Text>
                    <Text style={styles.exerciseItemDetails}>
                      {exercise.sets.length} sets × {exercise.sets[0]?.reps} reps
                      {exercise.sets[0]?.weight > 0 && ` @ ${exercise.sets[0].weight} lbs`}
                    </Text>
                    {exercise.notes && (
                      <Text style={styles.exerciseItemNotes}>{exercise.notes}</Text>
                    )}
                  </View>
                  <TouchableOpacity
                    onPress={() => handleRemoveExercise(exercise.id)}
                  >
                    <Ionicons name="close-circle" size={24} color="#FF3B30" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          {/* Add Exercise Form */}
          <View style={styles.addExerciseSection}>
            <Text style={styles.sectionTitle}>Add Exercise</Text>

            <View style={styles.section}>
              <Text style={styles.label}>Exercise Name *</Text>

              {/* Exercise Picker Button */}
              <TouchableOpacity
                style={styles.exercisePickerButton}
                onPress={() => setShowExercisePicker(true)}
              >
                <Ionicons name="search-outline" size={20} color="#3A9BFF" />
                <Text style={[
                  styles.exercisePickerButtonText,
                  exerciseName && styles.exercisePickerButtonTextSelected
                ]}>
                  {exerciseName || 'Select from exercise database'}
                </Text>
                <Ionicons name="chevron-forward" size={20} color="#A0A0A8" />
              </TouchableOpacity>

              {/* Manual Entry */}
              <Text style={styles.orText}>or enter custom name</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., Bench Press, Squat"
                placeholderTextColor="#98989D"
                value={exerciseName}
                onChangeText={setExerciseName}
                onBlur={() => loadExerciseHistory(exerciseName)}
                autoCapitalize="words"
              />

              {/* Exercise History */}
              {exerciseName.trim() && (
                <ExerciseHistoryIndicator
                  lastPerformance={exerciseHistory}
                  loading={loadingHistory}
                />
              )}
            </View>

            <View style={styles.row}>
              <View style={styles.rowItem}>
                <Text style={styles.label}>Sets</Text>
                <TextInput
                  style={styles.input}
                  placeholder="3"
                  placeholderTextColor="#98989D"
                  value={sets}
                  onChangeText={setSets}
                  keyboardType="number-pad"
                />
              </View>

              <View style={styles.rowItem}>
                <Text style={styles.label}>Reps</Text>
                <TextInput
                  style={styles.input}
                  placeholder="10"
                  placeholderTextColor="#98989D"
                  value={reps}
                  onChangeText={setReps}
                  keyboardType="number-pad"
                />
              </View>

              <View style={styles.rowItem}>
                <Text style={styles.label}>Weight (lbs)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="0"
                  placeholderTextColor="#98989D"
                  value={weight}
                  onChangeText={setWeight}
                  keyboardType="number-pad"
                />
              </View>
            </View>

            {/* Exercise Notes */}
            <View style={styles.section}>
              <Text style={styles.label}>Exercise Notes (Optional)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Form cues, adjustments, etc."
                placeholderTextColor="#98989D"
                value={exerciseNotes}
                onChangeText={setExerciseNotes}
                multiline
                numberOfLines={2}
                textAlignVertical="top"
              />
            </View>

            <TouchableOpacity
              style={styles.addExerciseButton}
              onPress={handleAddExercise}
            >
              <Ionicons name="add-circle" size={20} color="#007AFF" />
              <Text style={styles.addExerciseButtonText}>Add Exercise</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.helpSection}>
            <Ionicons name="information-circle-outline" size={20} color="#666" />
            <Text style={styles.helpText}>
              Update the workout name, add new exercises, or remove existing ones. Tap Save to apply changes.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Exercise Picker Modal */}
      <ExercisePicker
        visible={showExercisePicker}
        onClose={() => setShowExercisePicker(false)}
        onSelectExercise={handleSelectExercise}
        currentExerciseName={exerciseName}
      />
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1E1E22',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#3A3A42',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  cancelButton: {
    fontSize: 16,
    color: '#A0A0A8',
  },
  saveButton: {
    fontSize: 16,
    color: '#3A9BFF',
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#3A3A42',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#2A2A30',
    color: '#FFFFFF',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  rowItem: {
    flex: 1,
  },
  exercisesList: {
    marginBottom: 24,
  },
  exerciseItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#0F1A2E',
    borderRadius: 8,
    marginBottom: 8,
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseItemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  exerciseItemDetails: {
    fontSize: 14,
    color: '#A0A0A8',
  },
  exerciseItemNotes: {
    fontSize: 13,
    color: '#A0A0A8',
    marginTop: 4,
    fontStyle: 'italic',
  },
  textArea: {
    height: 80,
    paddingTop: 12,
  },
  addExerciseSection: {
    backgroundColor: '#2A2A30',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  addExerciseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    backgroundColor: '#0F1A2E',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#3A9BFF',
    borderStyle: 'dashed',
  },
  addExerciseButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3A9BFF',
    marginLeft: 8,
  },
  helpSection: {
    flexDirection: 'row',
    backgroundColor: '#2E2416',
    padding: 12,
    borderRadius: 8,
    alignItems: 'flex-start',
  },
  helpText: {
    flex: 1,
    fontSize: 13,
    color: '#A0A0A8',
    marginLeft: 8,
    lineHeight: 18,
  },
  exercisePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2A2A30',
    borderWidth: 1,
    borderColor: '#3A3A42',
    borderRadius: 8,
    padding: 14,
    marginBottom: 12,
  },
  exercisePickerButtonText: {
    flex: 1,
    fontSize: 16,
    color: '#A0A0A8',
    marginLeft: 10,
  },
  exercisePickerButtonTextSelected: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
  orText: {
    fontSize: 13,
    color: '#A0A0A8',
    textAlign: 'center',
    marginBottom: 10,
  },
});

export default EditWorkoutModal;
