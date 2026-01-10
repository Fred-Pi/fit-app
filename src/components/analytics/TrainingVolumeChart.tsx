import React from 'react'
import { View, Text, StyleSheet, Dimensions } from 'react-native'
import { colors } from '../../utils/theme'
import { BarChart } from 'react-native-chart-kit'
import { VolumeDataPoint } from '../../types'
import { ANALYTICS_CHART_CONFIG } from '../../utils/analyticsChartConfig'
import { formatVolume } from '../../utils/analyticsCalculations'
import Card from '../Card'

interface TrainingVolumeChartProps {
  volumeData: VolumeDataPoint[]
  stats: {
    total: number
    avgWeekly: number
    peak: number
    peakDate: string
  }
  unit: 'kg' | 'lbs'
}

const TrainingVolumeChart: React.FC<TrainingVolumeChartProps> = ({
  volumeData,
  stats,
  unit
}) => {
  const screenWidth = Dimensions.get('window').width

  if (volumeData.length === 0) {
    return (
      <Card>
        <Text style={styles.title}>Training Volume</Text>
        <Text style={styles.subtitle}>Weekly volume trends</Text>
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No workout data available</Text>
          <Text style={styles.emptySubtext}>
            Complete workouts to see your volume trends
          </Text>
        </View>
      </Card>
    )
  }

  // Limit to last 12 weeks for readability
  const displayData = volumeData.slice(-12)

  // Format labels (show first 3 chars of month + day)
  const labels = displayData.map(point => {
    const date = new Date(point.date)
    return `${date.getMonth() + 1}/${date.getDate()}`
  })

  const chartData = {
    labels,
    datasets: [
      {
        data: displayData.map(point => point.volume)
      }
    ]
  }

  return (
    <Card>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Training Volume</Text>
          <Text style={styles.subtitle}>Weekly volume trends</Text>
        </View>
      </View>

      <BarChart
        data={chartData}
        width={screenWidth - 60}
        height={220}
        chartConfig={ANALYTICS_CHART_CONFIG}
        style={styles.chart}
        yAxisLabel=""
        yAxisSuffix=""
        fromZero
        showBarTops={false}
        withInnerLines={true}
      />

      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{formatVolume(stats.total, unit)}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{formatVolume(stats.avgWeekly, unit)}</Text>
          <Text style={styles.statLabel}>Avg/Week</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{formatVolume(stats.peak, unit)}</Text>
          <Text style={styles.statLabel}>Peak</Text>
        </View>
      </View>
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
  chart: {
    marginVertical: 8,
    borderRadius: 12,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#3A3A42',
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
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#3A3A42',
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

export default React.memo(TrainingVolumeChart)
