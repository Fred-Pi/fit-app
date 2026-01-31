import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { colors } from '../utils/theme';
import { Picker } from '@react-native-picker/picker';
import { Exercise, MuscleGroup } from '../types';
import { EXERCISE_CATEGORIES } from '../data/exercises';
import { generateCustomExerciseId, validateExerciseName } from '../utils/exerciseHelpers';
import { successHaptic } from '../utils/haptics';
import { useAuthStore } from '../stores/authStore';
import ResponsiveModal from './ResponsiveModal';

interface AddCustomExerciseModalProps {
  visible: boolean
  onClose: () => void
  onSave: (exercise: Exercise) => void
  allExercises: Exercise[]
}

const AddCustomExerciseModal: React.FC<AddCustomExerciseModalProps> = ({
  visible,
  onClose,
  onSave,
  allExercises,
}) => {
  const [name, setName] = useState('')
  const [category, setCategory] = useState<MuscleGroup>('Chest')
  const [defaultSets, setDefaultSets] = useState('')
  const [defaultReps, setDefaultReps] = useState('')

  useEffect(() => {
    if (visible) {
      // Reset form when modal opens
      setName('')
      setCategory('Chest')
      setDefaultSets('')
      setDefaultReps('')
    }
  }, [visible])

  const handleSave = () => {
    // Validate name
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter an exercise name')
      return
    }

    if (name.trim().length < 2) {
      Alert.alert('Error', 'Exercise name must be at least 2 characters')
      return
    }

    // Check for duplicate names
    if (!validateExerciseName(name, allExercises)) {
      Alert.alert(
        'Duplicate Name',
        'An exercise with this name already exists. Please choose a different name.'
      )
      return
    }

    // Validate default sets/reps if provided
    if (defaultSets && (parseInt(defaultSets) <= 0 || isNaN(parseInt(defaultSets)))) {
      Alert.alert('Error', 'Default sets must be a positive number')
      return
    }

    if (defaultReps && (parseInt(defaultReps) <= 0 || isNaN(parseInt(defaultReps)))) {
      Alert.alert('Error', 'Default reps must be a positive number')
      return
    }

    // Create exercise object
    const userId = useAuthStore.getState().user?.id
    if (!userId) {
      Alert.alert('Error', 'Please log in to add custom exercises')
      return
    }

    const exercise: Exercise = {
      id: generateCustomExerciseId(),
      userId,
      name: name.trim(),
      category,
      ...(defaultSets && { defaultSets: parseInt(defaultSets) }),
      ...(defaultReps && { defaultReps: parseInt(defaultReps) }),
    }

    successHaptic()
    onSave(exercise)
    onClose()
  }

  const handleClose = () => {
    if (name.trim()) {
      Alert.alert(
        'Discard Exercise?',
        'You have unsaved changes. Are you sure you want to discard this exercise?',
        [
          { text: 'Keep Editing', style: 'cancel' },
          { text: 'Discard', style: 'destructive', onPress: onClose },
        ]
      )
    } else {
      onClose()
    }
  }

  return (
    <ResponsiveModal
      visible={visible}
      onClose={handleClose}
      size="md"
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose}>
            <Text style={styles.cancelButton}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.title}>New Exercise</Text>
          <TouchableOpacity onPress={handleSave}>
            <Text style={styles.saveButton}>Save</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer} keyboardDismissMode="on-drag">
          <View style={styles.section}>
            <Text style={styles.label}>
              Exercise Name <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="e.g., Cable Crossover"
              placeholderTextColor="#666"
              autoFocus
              autoCapitalize="words"
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>
              Category <Text style={styles.required}>*</Text>
            </Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={category}
                onValueChange={(value: MuscleGroup) => setCategory(value)}
                style={styles.picker}
                itemStyle={styles.pickerItem}
              >
                {EXERCISE_CATEGORIES.map(cat => (
                  <Picker.Item
                    key={cat.name}
                    label={cat.name}
                    value={cat.name}
                  />
                ))}
              </Picker>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Default Values (Optional)</Text>
            <Text style={styles.sectionSubtitle}>
              These will pre-fill when adding this exercise to a workout
            </Text>

            <View style={styles.row}>
              <View style={styles.rowItem}>
                <Text style={styles.label}>Default Sets</Text>
                <TextInput
                  style={styles.input}
                  value={defaultSets}
                  onChangeText={setDefaultSets}
                  placeholder="e.g., 3"
                  placeholderTextColor="#666"
                  keyboardType="number-pad"
                />
              </View>

              <View style={styles.rowItem}>
                <Text style={styles.label}>Default Reps</Text>
                <TextInput
                  style={styles.input}
                  value={defaultReps}
                  onChangeText={setDefaultReps}
                  placeholder="e.g., 10"
                  placeholderTextColor="#666"
                  keyboardType="number-pad"
                />
              </View>
            </View>
          </View>
        </ScrollView>
      </View>
    </ResponsiveModal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0E0E14',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#3A3A42',
    backgroundColor: '#1E1E22',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  cancelButton: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  saveButton: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 8,
  },
  required: {
    color: '#FF453A',
  },
  input: {
    borderWidth: 1,
    borderColor: '#3A3A42',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#2A2A30',
    color: colors.text,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#3A3A42',
    borderRadius: 8,
    backgroundColor: '#2A2A30',
    overflow: 'hidden',
  },
  picker: {
    color: colors.text,
  },
  pickerItem: {
    color: colors.text,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  rowItem: {
    flex: 1,
  },
})

export default AddCustomExerciseModal
