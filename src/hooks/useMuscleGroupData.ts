import { useMemo } from 'react'
import { WorkoutLog, MuscleGroupHeatmapData } from '../types'
import { calculateMuscleGroupHeatmap } from '../utils/muscleGroupCalculations'

/**
 * Hook to calculate muscle group heatmap data from workouts
 * Memoized for performance
 */
export function useMuscleGroupData(
  workouts: WorkoutLog[],
  days: number = 7
): MuscleGroupHeatmapData {
  return useMemo(() => {
    return calculateMuscleGroupHeatmap(workouts, days)
  }, [workouts, days])
}
