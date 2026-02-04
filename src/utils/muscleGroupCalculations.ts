/**
 * Muscle Group Heatmap Calculations
 *
 * Analyzes workout data to determine training intensity
 * for each muscle group over a specified period.
 */

import { WorkoutLog, MuscleGroup, MuscleGroupScore, MuscleGroupHeatmapData } from '../types'
import { getExerciseByName } from '../data/exercises'

const ALL_MUSCLE_GROUPS: MuscleGroup[] = [
  'Chest', 'Back', 'Shoulders', 'Arms', 'Legs', 'Core', 'Cardio'
]

/**
 * Get the muscle group for an exercise by name
 * Falls back to 'Core' if not found in database
 */
export function getExerciseMuscleGroup(exerciseName: string): MuscleGroup {
  const exercise = getExerciseByName(exerciseName)
  return exercise?.category || 'Core'
}

/**
 * Get intensity level based on normalized score
 */
function getIntensityLevel(score: number): 'none' | 'low' | 'medium' | 'high' {
  if (score === 0) return 'none'
  if (score < 30) return 'low'
  if (score < 70) return 'medium'
  return 'high'
}

/**
 * Calculate muscle group heatmap data from workouts
 *
 * Uses a combined score:
 * - 60% weight on volume (sets performed)
 * - 40% weight on frequency (days trained)
 */
export function calculateMuscleGroupHeatmap(
  workouts: WorkoutLog[],
  days: number = 7
): MuscleGroupHeatmapData {
  const endDate = new Date()
  const startDate = new Date()
  startDate.setDate(endDate.getDate() - days)
  startDate.setHours(0, 0, 0, 0)

  // Filter workouts to the period (completed only)
  const periodWorkouts = workouts.filter(w => {
    const workoutDate = new Date(w.date)
    return workoutDate >= startDate && workoutDate <= endDate && w.completed
  })

  // Initialize accumulators for each muscle group
  const groupData: Record<MuscleGroup, {
    sets: number
    volume: number
    days: Set<string>
    lastTrained: string | null
  }> = {} as Record<MuscleGroup, { sets: number; volume: number; days: Set<string>; lastTrained: string | null }>

  ALL_MUSCLE_GROUPS.forEach(group => {
    groupData[group] = { sets: 0, volume: 0, days: new Set(), lastTrained: null }
  })

  // Aggregate data from workouts
  periodWorkouts.forEach(workout => {
    workout.exercises.forEach(exercise => {
      const muscleGroup = getExerciseMuscleGroup(exercise.exerciseName)
      const data = groupData[muscleGroup]

      const exerciseSets = exercise.sets.filter(s => s.completed).length
      const exerciseVolume = exercise.sets
        .filter(s => s.completed)
        .reduce((sum, set) => sum + (set.weight * set.reps), 0)

      data.sets += exerciseSets
      data.volume += exerciseVolume
      data.days.add(workout.date)

      if (!data.lastTrained || workout.date > data.lastTrained) {
        data.lastTrained = workout.date
      }
    })
  })

  // Calculate max values for normalization
  const maxSets = Math.max(...ALL_MUSCLE_GROUPS.map(g => groupData[g].sets), 1)

  // Calculate scores for each muscle group
  const scores: MuscleGroupScore[] = ALL_MUSCLE_GROUPS.map(group => {
    const data = groupData[group]
    const volumeWeight = data.sets / maxSets
    const frequencyWeight = data.days.size / days
    const rawScore = (volumeWeight * 0.6) + (frequencyWeight * 0.4)
    const score = Math.round(rawScore * 100)

    return {
      name: group,
      sets: data.sets,
      volume: data.volume,
      daysTrained: data.days.size,
      score,
      intensity: getIntensityLevel(score),
      lastTrained: data.lastTrained
    }
  })

  // Determine insights
  const sortedScores = [...scores].sort((a, b) => b.score - a.score)
  const mostTrained = sortedScores[0]?.score > 0 ? sortedScores[0].name : null
  const needsAttention = scores
    .filter(s => s.name !== 'Cardio' && s.score === 0) // Exclude cardio from "needs attention"
    .map(s => s.name)

  const totalSets = scores.reduce((sum, s) => sum + s.sets, 0)
  const uniqueDays = new Set(periodWorkouts.map(w => w.date))

  return {
    scores,
    mostTrained,
    needsAttention,
    totalSets,
    daysActive: uniqueDays.size
  }
}
