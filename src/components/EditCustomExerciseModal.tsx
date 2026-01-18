import React, { useState, useEffect } from 'react'
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native'
import { colors } from '../utils/theme'
import { Picker } from '@react-native-picker/picker'
import { Exercise, MuscleGroup, WorkoutLog } from '../types'
import { EXERCISE_CATEGORIES } from '../data/exercises'
import { validateExerciseName, getExerciseUsageCount } from '../utils/exerciseHelpers'
import { successHaptic } from '../utils/haptics'

interface EditCustomExerciseModalProps {
  visible: boolean
  onClose: () => void
  onSave: (exercise: Exercise, shouldUpdateWorkouts: boolean) => void
  exercise: Exercise | null
  allExercises: Exercise[]
  workouts: WorkoutLog[]
}

const EditCustomExerciseModal: React.FC<EditCustomExerciseModalProps> = ({
  visible,
  onClose,
  onSave,
  exercise,
  allExercises,
  workouts,
}) => {
  const [name, setName] = useState('')
  const [category, setCategory] = useState<MuscleGroup>('Chest')
  const [defaultSets, setDefaultSets] = useState('')
  const [defaultReps, setDefaultReps] = useState('')
  const [hasChanges, setHasChanges] = useState(false)

  useEffect(() => {
    if (visible && exercise) {
      // Populate form with exercise data
      setName(exercise.name)
      setCategory(exercise.category)
      setDefaultSets(exercise.defaultSets?.toString() || '')
      setDefaultReps(exercise.defaultReps?.toString() || '')
      setHasChanges(false)
    }
  }, [visible, exercise])

  const handleSave = () => {
    if (!exercise) return

    // Validate name
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter an exercise name')
      return
    }

    if (name.trim().length < 2) {
      Alert.alert('Error', 'Exercise name must be at least 2 characters')
      return
    }

    // Check for duplicate names (excluding current exercise)
    if (!validateExerciseName(name, allExercises, exercise.id)) {
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

    // Check if name changed and exercise is used in workouts
    const nameChanged = name.trim() !== exercise.name
    const usageCount = getExerciseUsageCount(exercise.name, workouts)

    if (nameChanged && usageCount > 0) {
      // Warn user and ask if they want to update workout references
      Alert.alert(
        'Update Workout References?',
        `This exercise is used in ${usageCount} workout(s). Do you want to update all references to use the new name?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Update All',
            style: 'default',
            onPress: () => saveExercise(true),
          },
        ]
      )
    } else {
      saveExercise(false)
    }
  }

  const saveExercise = (shouldUpdateWorkouts: boolean) => {
    if (!exercise) return

    const updatedExercise: Exercise = {
      ...exercise,
      name: name.trim(),
      category,
      defaultSets: defaultSets ? parseInt(defaultSets) : undefined,
      defaultReps: defaultReps ? parseInt(defaultReps) : undefined,
    }

    successHaptic()
    onSave(updatedExercise, shouldUpdateWorkouts)
    onClose()
  }

  const handleClose = () => {
    if (hasChanges) {
      Alert.alert(
        'Discard Changes?',
        'You have unsaved changes. Are you sure you want to discard them?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Discard', style: 'destructive', onPress: onClose },
        ]
      )
    } else {
      onClose()
    }
  }

  const handleFieldChange = (field: string, value: string) => {
    setHasChanges(true)
    switch (field) {
      case 'name':
        setName(value)
        break
      case 'defaultSets':
        setDefaultSets(value)
        break
      case 'defaultReps':
        setDefaultReps(value)
        break
    }
  }

  const handleCategoryChange = (value: MuscleGroup) => {
    setHasChanges(true)
    setCategory(value)
  }

  if (!exercise) return null

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
          <Text style={styles.title}>Edit Exercise</Text>
          <TouchableOpacity onPress={handleSave}>
            <Text style={styles.saveButton}>Save</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
          <View style={styles.section}>
            <Text style={styles.label}>
              Exercise Name <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={(value) => handleFieldChange('name', value)}
              placeholder="e.g., Cable Crossover"
              placeholderTextColor="#666"
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
                onValueChange={handleCategoryChange}
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
                  onChangeText={(value) => handleFieldChange('defaultSets', value)}
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
                  onChangeText={(value) => handleFieldChange('defaultReps', value)}
                  placeholder="e.g., 10"
                  placeholderTextColor="#666"
                  keyboardType="number-pad"
                />
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  )
}

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

export default EditCustomExerciseModal
