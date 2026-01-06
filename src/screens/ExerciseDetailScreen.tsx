import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native'
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import { Ionicons } from '@expo/vector-icons'
import { Exercise, WorkoutLog } from '../types'
import { EXERCISE_CATEGORIES } from '../data/exercises'
import {
  getCustomExercises,
  getWorkouts,
  deleteCustomExercise,
  saveWorkout,
} from '../services/storage'
import {
  getAllExercises,
  isCustomExercise,
  getExerciseWorkoutHistory,
  getExerciseUsageCount,
  findExerciseByName,
} from '../utils/exerciseHelpers'
import Card from '../components/Card'
import EditCustomExerciseModal from '../components/EditCustomExerciseModal'
import { ExercisesStackParamList } from '../navigation/ExercisesStack'

type ExerciseDetailScreenRouteProp = RouteProp<
  ExercisesStackParamList,
  'ExerciseDetail'
>

type ExerciseDetailScreenNavigationProp = StackNavigationProp<
  ExercisesStackParamList,
  'ExerciseDetail'
>

const ExerciseDetailScreen = () => {
  const route = useRoute<ExerciseDetailScreenRouteProp>()
  const navigation = useNavigation<ExerciseDetailScreenNavigationProp>()
  const { exerciseId } = route.params

  const [exercise, setExercise] = useState<Exercise | null>(null)
  const [workoutHistory, setWorkoutHistory] = useState<WorkoutLog[]>([])
  const [allExercises, setAllExercises] = useState<Exercise[]>([])
  const [loading, setLoading] = useState(true)
  const [showEditModal, setShowEditModal] = useState(false)

  const loadExerciseData = async () => {
    try {
      const customExercises = await getCustomExercises()
      const all = getAllExercises(customExercises)
      setAllExercises(all)

      const ex = all.find(e => e.id === exerciseId)
      if (!ex) {
        Alert.alert('Error', 'Exercise not found')
        navigation.goBack()
        return
      }

      setExercise(ex)

      const workouts = await getWorkouts()
      const history = getExerciseWorkoutHistory(ex.name, workouts)
      setWorkoutHistory(history)
    } catch (error) {
      console.error('Error loading exercise:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadExerciseData()
  }, [exerciseId])

  const handleEditExercise = async (
    updatedExercise: Exercise,
    shouldUpdateWorkouts: boolean
  ) => {
    if (!exercise) return

    // Update workouts if needed
    if (shouldUpdateWorkouts) {
      const workouts = await getWorkouts()
      const updatedWorkouts = workouts.map(workout => ({
        ...workout,
        exercises: workout.exercises.map(ex =>
          ex.exerciseName.toLowerCase() === exercise.name.toLowerCase()
            ? { ...ex, exerciseName: updatedExercise.name }
            : ex
        ),
      }))

      for (const workout of updatedWorkouts) {
        await saveWorkout(workout)
      }
    }

    await loadExerciseData()
  }

  const handleDeleteExercise = async () => {
    if (!exercise) return

    const usageCount = getExerciseUsageCount(exercise.name, workoutHistory)

    const message =
      usageCount > 0
        ? `This exercise is used in ${usageCount} workout(s). Deleting it won't remove it from those workouts, but you won't be able to add it to new workouts.`
        : 'Are you sure you want to delete this exercise?'

    Alert.alert('Delete Exercise', message, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteCustomExercise(exercise.id)
          navigation.goBack()
        },
      },
    ])
  }

  if (loading || !exercise) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    )
  }

  const category = EXERCISE_CATEGORIES.find(cat => cat.name === exercise.category)
  const isCustom = isCustomExercise(exercise.id)
  const usageCount = workoutHistory.length
  const lastPerformed =
    workoutHistory.length > 0 ? new Date(workoutHistory[0].date) : null

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Header Card */}
      <Card>
        <View style={styles.headerContainer}>
          <View style={styles.iconContainer}>
            <Ionicons
              name={category?.icon as any || 'barbell'}
              size={32}
              color={category?.color || '#A0A0A8'}
            />
          </View>
          <View style={styles.headerContent}>
            <Text style={styles.exerciseName}>{exercise.name}</Text>
            <View style={styles.badgesRow}>
              <View
                style={[
                  styles.categoryBadge,
                  { backgroundColor: category?.color || '#666' },
                ]}
              >
                <Text style={styles.categoryBadgeText}>{exercise.category}</Text>
              </View>
              {isCustom && (
                <View style={styles.customBadge}>
                  <Text style={styles.customBadgeText}>Custom</Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </Card>

      {/* Default Values (if available) */}
      {(exercise.defaultSets || exercise.defaultReps) && (
        <Card>
          <Text style={styles.cardTitle}>Default Values</Text>
          <View style={styles.defaultsRow}>
            {exercise.defaultSets && (
              <View style={styles.defaultItem}>
                <Text style={styles.defaultValue}>{exercise.defaultSets}</Text>
                <Text style={styles.defaultLabel}>Sets</Text>
              </View>
            )}
            {exercise.defaultReps && (
              <View style={styles.defaultItem}>
                <Text style={styles.defaultValue}>{exercise.defaultReps}</Text>
                <Text style={styles.defaultLabel}>Reps</Text>
              </View>
            )}
          </View>
        </Card>
      )}

      {/* Usage Statistics */}
      <Card>
        <Text style={styles.cardTitle}>Usage Statistics</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{usageCount}</Text>
            <Text style={styles.statLabel}>Workouts</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {lastPerformed
                ? lastPerformed.toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  })
                : 'Never'}
            </Text>
            <Text style={styles.statLabel}>Last Performed</Text>
          </View>
        </View>
      </Card>

      {/* Workout History */}
      <Card>
        <Text style={styles.cardTitle}>Workout History</Text>
        {workoutHistory.length > 0 ? (
          <View style={styles.historyList}>
            {workoutHistory.map(workout => {
              const workoutExercise = workout.exercises.find(
                ex => ex.exerciseName.toLowerCase() === exercise.name.toLowerCase()
              )

              if (!workoutExercise) return null

              const totalSets = workoutExercise.sets.length
              const maxWeight = Math.max(...workoutExercise.sets.map(s => s.weight))

              return (
                <View key={workout.id} style={styles.historyItem}>
                  <View style={styles.historyLeft}>
                    <Text style={styles.historyDate}>
                      {new Date(workout.date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </Text>
                    <Text style={styles.historyWorkout}>{workout.name}</Text>
                  </View>
                  <View style={styles.historyRight}>
                    <Text style={styles.historyStats}>
                      {totalSets} sets • {maxWeight} lbs
                    </Text>
                  </View>
                </View>
              )
            })}
          </View>
        ) : (
          <View style={styles.emptyHistory}>
            <Text style={styles.emptyHistoryText}>
              No workouts recorded with this exercise yet
            </Text>
          </View>
        )}
      </Card>

      {/* Actions (for custom exercises only) */}
      {isCustom && (
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => setShowEditModal(true)}
          >
            <Ionicons name="create-outline" size={20} color="#3A9BFF" />
            <Text style={styles.editButtonText}>Edit Exercise</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.deleteButton}
            onPress={handleDeleteExercise}
          >
            <Ionicons name="trash-outline" size={20} color="#FF3B30" />
            <Text style={styles.deleteButtonText}>Delete Exercise</Text>
          </TouchableOpacity>
        </View>
      )}

      {isCustom && (
        <EditCustomExerciseModal
          visible={showEditModal}
          onClose={() => setShowEditModal(false)}
          onSave={handleEditExercise}
          exercise={exercise}
          allExercises={allExercises}
          workouts={workoutHistory}
        />
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0E0E14',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0E0E14',
  },
  loadingText: {
    fontSize: 16,
    color: '#98989D',
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 32,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#2A2A30',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContent: {
    flex: 1,
  },
  exerciseName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  badgesRow: {
    flexDirection: 'row',
    gap: 8,
  },
  categoryBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  categoryBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
    textTransform: 'uppercase',
  },
  customBadge: {
    backgroundColor: '#A855F7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  customBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
    textTransform: 'uppercase',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  defaultsRow: {
    flexDirection: 'row',
    gap: 32,
  },
  defaultItem: {
    alignItems: 'center',
  },
  defaultValue: {
    fontSize: 32,
    fontWeight: '700',
    color: '#3A9BFF',
    marginBottom: 4,
  },
  defaultLabel: {
    fontSize: 14,
    color: '#A0A0A8',
    fontWeight: '500',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 24,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#2A2A30',
    borderRadius: 12,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#3A9BFF',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#A0A0A8',
    fontWeight: '500',
  },
  historyList: {
    gap: 12,
  },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: '#2A2A30',
    borderRadius: 8,
  },
  historyLeft: {
    flex: 1,
  },
  historyDate: {
    fontSize: 14,
    color: '#A0A0A8',
    marginBottom: 4,
  },
  historyWorkout: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  historyRight: {
    justifyContent: 'center',
  },
  historyStats: {
    fontSize: 14,
    color: '#A0A0A8',
  },
  emptyHistory: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  emptyHistoryText: {
    fontSize: 14,
    color: '#A0A0A8',
    textAlign: 'center',
  },
  actionsContainer: {
    gap: 12,
    marginTop: 8,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    backgroundColor: '#2A2A30',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#3A9BFF',
  },
  editButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3A9BFF',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    backgroundColor: '#2A2A30',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#FF3B30',
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF3B30',
  },
})

export default ExerciseDetailScreen
