import { Exercise, WorkoutLog } from '../types'
import { EXERCISE_DATABASE } from '../data/exercises'

/**
 * Merge built-in exercises with custom exercises
 */
export function getAllExercises(customExercises: Exercise[]): Exercise[] {
  return [...EXERCISE_DATABASE, ...customExercises]
}

/**
 * Check if exercise name is unique (case-insensitive)
 */
export function validateExerciseName(
  name: string,
  allExercises: Exercise[],
  excludeId?: string
): boolean {
  const nameLower = name.trim().toLowerCase()

  return !allExercises.some(
    exercise =>
      exercise.name.toLowerCase() === nameLower &&
      exercise.id !== excludeId
  )
}

/**
 * Check if an exercise is custom (vs built-in)
 */
export function isCustomExercise(exerciseId: string): boolean {
  return exerciseId.startsWith('custom_')
}

/**
 * Count how many workouts use a specific exercise
 */
export function getExerciseUsageCount(
  exerciseName: string,
  workouts: WorkoutLog[]
): number {
  const nameLower = exerciseName.toLowerCase()

  return workouts.filter(workout =>
    workout.exercises.some(
      exercise => exercise.exerciseName.toLowerCase() === nameLower
    )
  ).length
}

/**
 * Get all workouts containing a specific exercise
 */
export function getExerciseWorkoutHistory(
  exerciseName: string,
  workouts: WorkoutLog[]
): WorkoutLog[] {
  const nameLower = exerciseName.toLowerCase()

  return workouts
    .filter(workout =>
      workout.exercises.some(
        exercise => exercise.exerciseName.toLowerCase() === nameLower
      )
    )
    .sort((a, b) => b.date.localeCompare(a.date)) // Most recent first
}

/**
 * Update exercise name in all workouts (for when renaming custom exercise)
 */
export function updateExerciseNameInWorkouts(
  oldName: string,
  newName: string,
  workouts: WorkoutLog[]
): WorkoutLog[] {
  const oldNameLower = oldName.toLowerCase()

  return workouts.map(workout => ({
    ...workout,
    exercises: workout.exercises.map(exercise =>
      exercise.exerciseName.toLowerCase() === oldNameLower
        ? { ...exercise, exerciseName: newName }
        : exercise
    )
  }))
}

/**
 * Find an exercise by name (case-insensitive)
 */
export function findExerciseByName(
  name: string,
  allExercises: Exercise[]
): Exercise | undefined {
  const nameLower = name.trim().toLowerCase()
  return allExercises.find(
    exercise => exercise.name.toLowerCase() === nameLower
  )
}

/**
 * Generate a custom exercise ID
 */
export function generateCustomExerciseId(): string {
  return `custom_${Date.now()}-${Math.random().toString(36).substring(2, 11)}`
}
