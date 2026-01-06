import { useMemo } from 'react'
import { WorkoutLog, VolumeDataPoint } from '../types'
import { calculateWeeklyVolume } from '../utils/analyticsCalculations'

interface VolumeStats {
  total: number
  avgWeekly: number
  peak: number
  peakDate: string
}

export function useTrainingVolume(workouts: WorkoutLog[]) {
  const volumeData = useMemo(() => {
    return calculateWeeklyVolume(workouts)
  }, [workouts])

  const stats = useMemo<VolumeStats>(() => {
    if (volumeData.length === 0) {
      return {
        total: 0,
        avgWeekly: 0,
        peak: 0,
        peakDate: ''
      }
    }

    const total = volumeData.reduce((sum, point) => sum + point.volume, 0)
    const avgWeekly = Math.round(total / volumeData.length)

    const peakPoint = volumeData.reduce((max, point) =>
      point.volume > max.volume ? point : max
    )

    return {
      total,
      avgWeekly,
      peak: peakPoint.volume,
      peakDate: peakPoint.date
    }
  }, [volumeData])

  return {
    volumeData,
    stats
  }
}
