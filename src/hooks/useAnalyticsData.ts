import { useState, useEffect, useMemo } from 'react'
import { WorkoutLog, DateRangeKey } from '../types'
import { getWorkouts } from '../services/storage'
import { getDateRange } from '../utils/analyticsCalculations'
import { useAuthStore } from '../stores/authStore'

export function useAnalyticsData(dateRange: DateRangeKey) {
  const [workouts, setWorkouts] = useState<WorkoutLog[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const loadWorkouts = async () => {
    try {
      const userId = useAuthStore.getState().user?.id
      if (!userId) {
        setLoading(false)
        return
      }
      const data = await getWorkouts(userId)
      // Only include completed workouts
      const completed = data.filter(w => w.completed)
      setWorkouts(completed)
    } catch (error) {
      console.error('Error loading workouts for analytics:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    loadWorkouts()
  }, [])

  const refresh = async () => {
    setRefreshing(true)
    await loadWorkouts()
  }

  // Filter workouts by date range with memoization
  const filteredWorkouts = useMemo(() => {
    const { start, end } = getDateRange(dateRange)
    return workouts.filter(
      w => w.date >= start && w.date <= end
    )
  }, [workouts, dateRange])

  return {
    workouts: filteredWorkouts,
    allWorkouts: workouts,
    loading,
    refreshing,
    refresh
  }
}
