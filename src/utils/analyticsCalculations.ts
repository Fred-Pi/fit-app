import { WorkoutLog, VolumeDataPoint, StrengthDataPoint, FrequencyDataPoint, DateRangeKey } from '../types'
import { getWeekDates, formatDateToISO } from './dateUtils'

/**
 * Calculate total volume (weight × reps) for a workout
 */
export function calculateWorkoutVolume(workout: WorkoutLog): number {
  return workout.exercises.reduce((total, exercise) => {
    const exerciseVolume = exercise.sets.reduce((setTotal, set) => {
      return setTotal + (set.weight * set.reps)
    }, 0)
    return total + exerciseVolume
  }, 0)
}

/**
 * Group workouts by week and calculate weekly volume
 */
export function calculateWeeklyVolume(
  workouts: WorkoutLog[]
): VolumeDataPoint[] {
  // Group by week start (Monday)
  const weekMap = new Map<string, { volume: number; count: number }>()

  workouts.forEach(workout => {
    const weekStart = getWeekDates(new Date(workout.date)).start
    const volume = calculateWorkoutVolume(workout)

    if (!weekMap.has(weekStart)) {
      weekMap.set(weekStart, { volume: 0, count: 0 })
    }

    const week = weekMap.get(weekStart)!
    week.volume += volume
    week.count += 1
  })

  // Convert to array and sort
  return Array.from(weekMap.entries())
    .map(([date, data]) => ({
      date,
      volume: Math.round(data.volume),
      workouts: data.count
    }))
    .sort((a, b) => a.date.localeCompare(b.date))
}

/**
 * Get strength progression for a specific exercise
 */
export function getStrengthProgression(
  workouts: WorkoutLog[],
  exerciseName: string
): StrengthDataPoint[] {
  const progressionData: StrengthDataPoint[] = []

  workouts.forEach(workout => {
    const exercise = workout.exercises.find(
      e => e.exerciseName.toLowerCase() === exerciseName.toLowerCase()
    )

    if (exercise && exercise.sets.length > 0) {
      // Find max weight set
      const maxWeightSet = exercise.sets.reduce((max, set) =>
        set.weight > max.weight ? set : max
      )

      progressionData.push({
        date: workout.date,
        weight: maxWeightSet.weight,
        reps: maxWeightSet.reps,
        workoutName: workout.name
      })
    }
  })

  return progressionData.sort((a, b) => a.date.localeCompare(b.date))
}

/**
 * Calculate frequency heatmap data
 */
export function calculateFrequencyHeatmap(
  workouts: WorkoutLog[]
): FrequencyDataPoint[] {
  const dateMap = new Map<string, number>()

  workouts.forEach(workout => {
    const count = dateMap.get(workout.date) || 0
    dateMap.set(workout.date, count + 1)
  })

  return Array.from(dateMap.entries())
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date))
}

/**
 * Calculate workout streak (current and longest)
 */
export function calculateWorkoutStreak(
  workouts: WorkoutLog[]
): { current: number; longest: number } {
  if (workouts.length === 0) return { current: 0, longest: 0 }

  // Get unique workout dates sorted descending
  const uniqueDates = Array.from(
    new Set(workouts.map(w => w.date))
  ).sort((a, b) => b.localeCompare(a))

  let currentStreak = 0
  let longestStreak = 0
  let tempStreak = 1

  // Check if today or yesterday has a workout
  const today = formatDateToISO(new Date())
  const yesterday = formatDateToISO(
    new Date(Date.now() - 24 * 60 * 60 * 1000)
  )

  if (uniqueDates[0] === today || uniqueDates[0] === yesterday) {
    currentStreak = 1

    // Count consecutive days backwards
    for (let i = 1; i < uniqueDates.length; i++) {
      const current = new Date(uniqueDates[i])
      const previous = new Date(uniqueDates[i - 1])
      const dayDiff = Math.floor(
        (previous.getTime() - current.getTime()) / (1000 * 60 * 60 * 24)
      )

      if (dayDiff === 1) {
        currentStreak++
      } else {
        break
      }
    }
  }

  // Calculate longest streak
  for (let i = 1; i < uniqueDates.length; i++) {
    const current = new Date(uniqueDates[i])
    const previous = new Date(uniqueDates[i - 1])
    const dayDiff = Math.floor(
      (previous.getTime() - current.getTime()) / (1000 * 60 * 60 * 24)
    )

    if (dayDiff === 1) {
      tempStreak++
      longestStreak = Math.max(longestStreak, tempStreak)
    } else {
      tempStreak = 1
    }
  }

  return {
    current: currentStreak,
    longest: Math.max(longestStreak, currentStreak)
  }
}

/**
 * Get date range from preset key
 */
export function getDateRange(rangeKey: DateRangeKey): { start: string; end: string } {
  const today = new Date()
  const endDate = formatDateToISO(today)

  if (rangeKey === 'ALL') {
    return { start: '2020-01-01', end: endDate }
  }

  const daysMap: Record<'30D' | '3M' | '6M', number> = {
    '30D': 30,
    '3M': 90,
    '6M': 180
  }

  const days = daysMap[rangeKey as '30D' | '3M' | '6M']
  const startDate = new Date(today)
  startDate.setDate(today.getDate() - days)

  return {
    start: formatDateToISO(startDate),
    end: endDate
  }
}

/**
 * Format volume number for display (e.g., "125k lbs" or "1.2k kg")
 */
export function formatVolume(volume: number, unit?: string): string {
  if (volume >= 1000000) {
    return `${(volume / 1000000).toFixed(1)}M${unit ? ' ' + unit : ''}`
  } else if (volume >= 1000) {
    return `${(volume / 1000).toFixed(1)}k${unit ? ' ' + unit : ''}`
  }
  return `${Math.round(volume)}${unit ? ' ' + unit : ''}`
}
