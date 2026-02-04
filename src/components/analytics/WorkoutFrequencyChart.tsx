import React, { useState } from 'react'
import { View, Text, StyleSheet, LayoutChangeEvent } from 'react-native'
import { colors } from '../../utils/theme'
import { ContributionGraph } from 'react-native-chart-kit'
import { FrequencyDataPoint } from '../../types'
import { ANALYTICS_CHART_CONFIG } from '../../utils/analyticsChartConfig'
import Card from '../Card'

interface WorkoutFrequencyChartProps {
  frequencyData: FrequencyDataPoint[]
  stats: {
    totalDays: number
    currentStreak: number
    longestStreak: number
    totalWorkouts: number
  }
}

const WorkoutFrequencyChart: React.FC<WorkoutFrequencyChartProps> = ({
  frequencyData,
  stats
}) => {
  const [chartWidth, setChartWidth] = useState(300)

  const onLayout = (event: LayoutChangeEvent) => {
    const { width } = event.nativeEvent.layout
    setChartWidth(width)
  }

  if (frequencyData.length === 0) {
    return (
      <Card>
        <Text style={styles.title}>Workout Frequency</Text>
        <Text style={styles.subtitle}>Training consistency heatmap</Text>
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No workout data available</Text>
          <Text style={styles.emptySubtext}>
            Log workouts to track your consistency
          </Text>
        </View>
      </Card>
    )
  }

  // Convert to format expected by ContributionGraph
  const chartData = frequencyData.map(point => ({
    date: point.date,
    count: point.count
  }))

  return (
    <Card>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Workout Frequency</Text>
          <Text style={styles.subtitle}>Training consistency heatmap</Text>
        </View>
      </View>

      <View onLayout={onLayout} style={styles.chartContainer}>
        <ContributionGraph
          values={chartData}
          endDate={new Date()}
          numDays={90}
          width={chartWidth}
          height={220}
          chartConfig={{
            ...ANALYTICS_CHART_CONFIG,
            color: (opacity = 1) => `rgba(52, 199, 89, ${opacity})`, // Green
          }}
          style={styles.chart}
          tooltipDataAttrs={(_value: unknown) => ({})}
        />
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{stats.totalDays}</Text>
          <Text style={styles.statLabel}>Active Days</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, styles.streakValue]}>
            {stats.currentStreak}
          </Text>
          <Text style={styles.statLabel}>Current Streak</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{stats.longestStreak}</Text>
          <Text style={styles.statLabel}>Best Streak</Text>
        </View>
      </View>

      {stats.currentStreak > 0 && (
        <View style={styles.streakBadge}>
          <Text style={styles.streakEmoji}>🔥</Text>
          <Text style={styles.streakText}>
            {stats.currentStreak} day streak!
          </Text>
        </View>
      )}
    </Card>
  )
}

const styles = StyleSheet.create({
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: 0.2,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
  },
  chartContainer: {
    overflow: 'hidden',
  },
  chart: {
    marginVertical: 8,
    borderRadius: 12,
    marginLeft: -16,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: 4,
  },
  streakValue: {
    color: colors.success,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  statDivider: {
    width: 1,
    backgroundColor: colors.borderLight,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: colors.successMuted,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.success,
  },
  streakEmoji: {
    fontSize: 16,
    marginRight: 6,
  },
  streakText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.success,
  },
  emptyState: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
})

export default React.memo(WorkoutFrequencyChart)
