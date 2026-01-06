import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { DateRangeKey, User } from '../types'
import { getUser } from '../services/storage'
import { useAnalyticsData } from '../hooks/useAnalyticsData'
import { useTrainingVolume } from '../hooks/useTrainingVolume'
import { useWorkoutFrequency } from '../hooks/useWorkoutFrequency'
import DateRangeSelector from '../components/analytics/DateRangeSelector'
import TrainingVolumeChart from '../components/analytics/TrainingVolumeChart'
import WorkoutFrequencyChart from '../components/analytics/WorkoutFrequencyChart'

const AnalyticsScreen = () => {
  const [user, setUser] = useState<User | null>(null)
  const [selectedRange, setSelectedRange] = useState<DateRangeKey>('3M')

  const { workouts, loading, refreshing, refresh } = useAnalyticsData(selectedRange)
  const { volumeData, stats: volumeStats } = useTrainingVolume(workouts)
  const { frequencyData, stats: frequencyStats } = useWorkoutFrequency(workouts)

  useEffect(() => {
    loadUser()
  }, [])

  const loadUser = async () => {
    const userData = await getUser()
    setUser(userData)
  }

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.loadingText}>Loading analytics...</Text>
      </View>
    )
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={refresh}
          tintColor="#3A9BFF"
        />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Ionicons name="analytics" size={32} color="#3A9BFF" />
          <View style={styles.headerText}>
            <Text style={styles.title}>Progress Analytics</Text>
            <Text style={styles.subtitle}>
              Track your training trends and consistency
            </Text>
          </View>
        </View>
      </View>

      {/* Date Range Selector */}
      <DateRangeSelector
        selectedRange={selectedRange}
        onRangeChange={setSelectedRange}
      />

      {/* Empty State */}
      {workouts.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="bar-chart-outline" size={80} color="#3A3A42" />
          <Text style={styles.emptyTitle}>No Data Yet</Text>
          <Text style={styles.emptyText}>
            Complete workouts to unlock your analytics dashboard
          </Text>
        </View>
      ) : (
        <>
          {/* Training Volume Chart */}
          <TrainingVolumeChart
            volumeData={volumeData}
            stats={volumeStats}
            unit={user?.preferredWeightUnit || 'lbs'}
          />

          {/* Workout Frequency Chart */}
          <WorkoutFrequencyChart
            frequencyData={frequencyData}
            stats={frequencyStats}
          />

          {/* Summary Stats */}
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Period Summary</Text>
            <View style={styles.summaryGrid}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryValue}>{workouts.length}</Text>
                <Text style={styles.summaryLabel}>Total Workouts</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryValue}>
                  {workouts.reduce((sum, w) => sum + w.exercises.length, 0)}
                </Text>
                <Text style={styles.summaryLabel}>Total Exercises</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryValue}>
                  {workouts.reduce(
                    (sum, w) =>
                      sum +
                      w.exercises.reduce((eSum, e) => eSum + e.sets.length, 0),
                    0
                  )}
                </Text>
                <Text style={styles.summaryLabel}>Total Sets</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryValue}>
                  {Math.round(
                    workouts.reduce((sum, w) => sum + (w.duration || 0), 0) / 60
                  )}h
                </Text>
                <Text style={styles.summaryLabel}>Total Time</Text>
              </View>
            </View>
          </View>
        </>
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0E0E14',
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 32,
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
  header: {
    marginBottom: 24,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 15,
    color: '#98989D',
    lineHeight: 20,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 24,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 16,
    color: '#98989D',
    textAlign: 'center',
    lineHeight: 24,
  },
  summaryCard: {
    backgroundColor: '#1C1C1E',
    borderRadius: 16,
    padding: 20,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#2C2C2E',
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  summaryItem: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#2C2C2E',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#3A9BFF',
    marginBottom: 6,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#98989D',
    fontWeight: '500',
    textAlign: 'center',
  },
})

export default AnalyticsScreen
