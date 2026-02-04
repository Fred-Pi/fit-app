import { useMemo } from 'react'
import { WorkoutLog } from '../types'
import { calculateFrequencyHeatmap, calculateWorkoutStreak } from '../utils/analyticsCalculations'

interface FrequencyStats {
  totalDays: number
  currentStreak: number
  longestStreak: number
  totalWorkouts: number
}

export function useWorkoutFrequency(workouts: WorkoutLog[]) {
  const frequencyData = useMemo(() => {
    return calculateFrequencyHeatmap(workouts)
  }, [workouts])

  const stats = useMemo<FrequencyStats>(() => {
    const streaks = calculateWorkoutStreak(workouts)

    return {
      totalDays: frequencyData.length,
      currentStreak: streaks.current,
      longestStreak: streaks.longest,
      totalWorkouts: workouts.length
    }
  }, [workouts, frequencyData])

  return {
    frequencyData,
    stats
  }
}
