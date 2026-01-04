import React, { useState } from 'react';
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
import { generateId } from '../services/storage';

interface AddWorkoutModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (workout: WorkoutLog) => void;
  date: string;
  userId: string;
}

const AddWorkoutModal: React.FC<AddWorkoutModalProps> = ({
  visible,
  onClose,
  onSave,
  date,
  userId,
}) => {
  const [workoutName, setWorkoutName] = useState('');
  const [exercises, setExercises] = useState<ExerciseLog[]>([]);

  // Current exercise being added
  const [exerciseName, setExerciseName] = useState('');
  const [sets, setSets] = useState('3');
  const [reps, setReps] = useState('10');
  const [weight, setWeight] = useState('');

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
    };

    setExercises([...exercises, newExercise]);

    // Reset exercise form
    setExerciseName('');
    setWeight('');
    Alert.alert('Success', `${exerciseName} added to workout`);
  };

  const handleRemoveExercise = (id: string) => {
    setExercises(exercises.filter(ex => ex.id !== id));
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
      exercises,
      completed: true,
      created: new Date().toISOString(),
    };

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
  };

  const handleClose = () => {
    if (workoutName || exercises.length > 0) {
      Alert.alert(
        'Discard Workout?',
        'You have unsaved changes. Are you sure you want to close?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Discard', style: 'destructive', onPress: () => {
            resetForm();
            onClose();
          }},
        ]
      );
    } else {
      resetForm();
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose}>
            <Text style={styles.cancelButton}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Log Workout</Text>
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
              <TextInput
                style={styles.input}
                placeholder="e.g., Bench Press, Squat"
                placeholderTextColor="#98989D"
                value={exerciseName}
                onChangeText={setExerciseName}
                autoCapitalize="words"
              />
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
              Add exercises one at a time. Each exercise will use the same reps and weight for all sets.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
});

export default AddWorkoutModal;
