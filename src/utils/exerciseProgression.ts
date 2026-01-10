/**
 * Exercise Progression Utilities
 *
 * Extracts and analyzes progression data for individual exercises
 * to show strength gains over time.
 */

import { WorkoutLog, ExerciseLog, SetLog } from '../types'

export interface ProgressionDataPoint {
  date: string
  bestWeight: number
  bestReps: number
  estimated1RM: number
  totalVolume: number
  totalSets: number
}

export interface ExerciseProgressionStats {
  exerciseName: string
  dataPoints: ProgressionDataPoint[]
  startingWeight: number
  currentWeight: number
  weightGain: number
  weightGainPercent: number
  starting1RM: number
  current1RM: number
  improvement1RM: number
  improvement1RMPercent: number
  totalWorkouts: number
  firstDate: string
  lastDate: string
}

/**
 * Calculate estimated 1RM using Epley formula
 */
function calculate1RM(weight: number, reps: number): number {
  if (reps === 1) return weight
  if (reps <= 0 || weight <= 0) return 0
  return Math.round(weight * (1 + reps / 30))
}

/**
 * Find the best set from an exercise log (highest weight, then highest reps)
 */
function findBestSet(sets: SetLog[]): SetLog | null {
  if (sets.length === 0) return null

  return sets.reduce((best, current) => {
    if (current.weight > best.weight) return current
    if (current.weight === best.weight && current.reps > best.reps) return current
    return best
  })
}

/**
 * Calculate total volume for an exercise
 */
function calculateVolume(sets: SetLog[]): number {
  return sets.reduce((total, set) => total + (set.weight * set.reps), 0)
}

/**
 * Get all unique exercise names from workouts
 */
export function getUniqueExercises(workouts: WorkoutLog[]): string[] {
  const exerciseSet = new Set<string>()

  workouts.forEach(workout => {
    workout.exercises.forEach(exercise => {
      exerciseSet.add(exercise.exerciseName)
    })
  })

  return Array.from(exerciseSet).sort()
}

/**
 * Get exercises with at least N data points (for meaningful charts)
 */
export function getExercisesWithHistory(workouts: WorkoutLog[], minDataPoints: number = 3): string[] {
  const exerciseCounts: Record<string, number> = {}

  workouts.forEach(workout => {
    workout.exercises.forEach(exercise => {
      exerciseCounts[exercise.exerciseName] = (exerciseCounts[exercise.exerciseName] || 0) + 1
    })
  })

  return Object.entries(exerciseCounts)
    .filter(([_, count]) => count >= minDataPoints)
    .sort((a, b) => b[1] - a[1]) // Sort by frequency
    .map(([name]) => name)
}

/**
 * Extract progression data for a specific exercise
 */
export function getExerciseProgression(
  workouts: WorkoutLog[],
  exerciseName: string
): ExerciseProgressionStats | null {
  // Filter workouts that contain this exercise
  const relevantWorkouts = workouts
    .filter(workout =>
      workout.exercises.some(e =>
        e.exerciseName.toLowerCase() === exerciseName.toLowerCase()
      )
    )
    .sort((a, b) => a.date.localeCompare(b.date)) // Sort by date ascending

  if (relevantWorkouts.length === 0) return null

  const dataPoints: ProgressionDataPoint[] = []

  relevantWorkouts.forEach(workout => {
    const exercise = workout.exercises.find(
      e => e.exerciseName.toLowerCase() === exerciseName.toLowerCase()
    )

    if (!exercise || exercise.sets.length === 0) return

    const bestSet = findBestSet(exercise.sets)
    if (!bestSet || bestSet.weight === 0) return

    const estimated1RM = calculate1RM(bestSet.weight, bestSet.reps)
    const totalVolume = calculateVolume(exercise.sets)

    dataPoints.push({
      date: workout.date,
      bestWeight: bestSet.weight,
      bestReps: bestSet.reps,
      estimated1RM,
      totalVolume,
      totalSets: exercise.sets.length,
    })
  })

  if (dataPoints.length === 0) return null

  // Calculate stats
  const firstPoint = dataPoints[0]
  const lastPoint = dataPoints[dataPoints.length - 1]

  const weightGain = lastPoint.bestWeight - firstPoint.bestWeight
  const weightGainPercent = firstPoint.bestWeight > 0
    ? Math.round((weightGain / firstPoint.bestWeight) * 100)
    : 0

  const improvement1RM = lastPoint.estimated1RM - firstPoint.estimated1RM
  const improvement1RMPercent = firstPoint.estimated1RM > 0
    ? Math.round((improvement1RM / firstPoint.estimated1RM) * 100)
    : 0

  return {
    exerciseName,
    dataPoints,
    startingWeight: firstPoint.bestWeight,
    currentWeight: lastPoint.bestWeight,
    weightGain,
    weightGainPercent,
    starting1RM: firstPoint.estimated1RM,
    current1RM: lastPoint.estimated1RM,
    improvement1RM,
    improvement1RMPercent,
    totalWorkouts: dataPoints.length,
    firstDate: firstPoint.date,
    lastDate: lastPoint.date,
  }
}

/**
 * Get the top N exercises by improvement percentage
 */
export function getTopProgressingExercises(
  workouts: WorkoutLog[],
  limit: number = 5
): ExerciseProgressionStats[] {
  const exercises = getExercisesWithHistory(workouts, 3)

  const progressions = exercises
    .map(name => getExerciseProgression(workouts, name))
    .filter((p): p is ExerciseProgressionStats => p !== null)
    .filter(p => p.improvement1RMPercent > 0) // Only show improvements
    .sort((a, b) => b.improvement1RMPercent - a.improvement1RMPercent)
    .slice(0, limit)

  return progressions
}

/**
 * Format the progression for display
 */
export function formatProgressionChange(value: number, percent: number, unit: string): string {
  const sign = value >= 0 ? '+' : ''
  return `${sign}${value} ${unit} (${sign}${percent}%)`
}
