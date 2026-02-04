import React, { useState, useEffect, useMemo } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  LayoutChangeEvent,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { LineChart } from 'react-native-chart-kit'
import { WorkoutLog } from '../../types'
import {
  getExercisesWithHistory,
  getExerciseProgression,
} from '../../utils/exerciseProgression'
import { colors } from '../../utils/theme'
import Card from '../Card'

interface ExerciseProgressionChartProps {
  workouts: WorkoutLog[]
  unit: 'kg' | 'lbs'
}

const ExerciseProgressionChart: React.FC<ExerciseProgressionChartProps> = ({
  workouts,
  unit,
}) => {
  const [selectedExercise, setSelectedExercise] = useState<string | null>(null)
  const [showPicker, setShowPicker] = useState(false)
  const [chartWidth, setChartWidth] = useState(300)

  // Get exercises with enough data for charts
  const availableExercises = useMemo(
    () => getExercisesWithHistory(workouts, 2),
    [workouts]
  )

  // Auto-select first exercise if none selected
  useEffect(() => {
    if (!selectedExercise && availableExercises.length > 0) {
      setSelectedExercise(availableExercises[0])
    }
  }, [availableExercises, selectedExercise])

  // Get progression data for selected exercise
  const progression = useMemo(() => {
    if (!selectedExercise) return null
    return getExerciseProgression(workouts, selectedExercise)
  }, [workouts, selectedExercise])

  const onLayout = (event: LayoutChangeEvent) => {
    const { width } = event.nativeEvent.layout
    setChartWidth(width)
  }

  if (availableExercises.length === 0) {
    return (
      <Card>
        <View style={styles.header}>
          <Ionicons name="trending-up" size={24} color={colors.primary} />
          <Text style={styles.title}>Exercise Progression</Text>
        </View>
        <View style={styles.emptyState}>
          <Ionicons name="barbell-outline" size={48} color={colors.textTertiary} />
          <Text style={styles.emptyTitle}>Not Enough Data</Text>
          <Text style={styles.emptyText}>
            Log the same exercise in at least 2 workouts to see your progression
          </Text>
        </View>
      </Card>
    )
  }

  // Prepare chart data
  const chartData = progression ? {
    labels: progression.dataPoints.slice(-10).map(p => {
      const date = new Date(p.date)
      return `${date.getMonth() + 1}/${date.getDate()}`
    }),
    datasets: [
      {
        data: progression.dataPoints.slice(-10).map(p => p.estimated1RM),
        color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
        strokeWidth: 3,
      },
    ],
  } : null

  const renderExercisePicker = () => (
    <View style={styles.pickerOverlay}>
      <View style={styles.pickerContainer}>
        <View style={styles.pickerHeader}>
          <Text style={styles.pickerTitle}>Select Exercise</Text>
          <TouchableOpacity onPress={() => setShowPicker(false)}>
            <Ionicons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>
        <ScrollView style={styles.pickerScroll}>
          {availableExercises.map(exercise => {
            const prog = getExerciseProgression(workouts, exercise)
            return (
              <TouchableOpacity
                key={exercise}
                style={[
                  styles.pickerOption,
                  selectedExercise === exercise && styles.pickerOptionSelected,
                ]}
                onPress={() => {
                  setSelectedExercise(exercise)
                  setShowPicker(false)
                }}
              >
                <View style={styles.pickerOptionContent}>
                  <Text
                    style={[
                      styles.pickerOptionText,
                      selectedExercise === exercise && styles.pickerOptionTextSelected,
                    ]}
                  >
                    {exercise}
                  </Text>
                  {prog && prog.improvement1RMPercent > 0 && (
                    <View style={styles.improvementBadge}>
                      <Ionicons name="trending-up" size={12} color={colors.success} />
                      <Text style={styles.improvementText}>
                        +{prog.improvement1RMPercent}%
                      </Text>
                    </View>
                  )}
                </View>
                <Text style={styles.pickerOptionMeta}>
                  {prog?.totalWorkouts || 0} workouts
                </Text>
              </TouchableOpacity>
            )
          })}
        </ScrollView>
      </View>
    </View>
  )

  return (
    <Card>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="trending-up" size={24} color={colors.primary} />
          <Text style={styles.title}>Exercise Progression</Text>
        </View>
      </View>

      {/* Exercise Selector */}
      <TouchableOpacity
        style={styles.selector}
        onPress={() => setShowPicker(true)}
      >
        <Text style={styles.selectorLabel}>Exercise</Text>
        <View style={styles.selectorValue}>
          <Text style={styles.selectorText}>{selectedExercise}</Text>
          <Ionicons name="chevron-down" size={20} color={colors.textSecondary} />
        </View>
      </TouchableOpacity>

      {/* Chart */}
      {progression && chartData && (
        <>
          <View onLayout={onLayout} style={styles.chartContainer}>
            <LineChart
              data={chartData}
              width={chartWidth}
              height={200}
              chartConfig={{
                backgroundColor: 'transparent',
                backgroundGradientFrom: colors.surface,
                backgroundGradientTo: colors.surface,
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
                labelColor: () => colors.textSecondary,
                style: { borderRadius: 12 },
                propsForDots: {
                  r: '4',
                  strokeWidth: '2',
                  stroke: colors.primary,
                },
                propsForBackgroundLines: {
                  strokeDasharray: '',
                  stroke: colors.border,
                  strokeWidth: 1,
                },
              }}
              bezier
              style={styles.chart}
              withInnerLines={true}
              withOuterLines={false}
              withVerticalLines={false}
              yAxisSuffix={` ${unit}`}
            />
          </View>

          {/* Stats */}
          <View style={styles.statsGrid}>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Starting</Text>
              <Text style={styles.statValue}>{progression.starting1RM}</Text>
              <Text style={styles.statUnit}>{unit} (est. 1RM)</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Current</Text>
              <Text style={[styles.statValue, styles.statValueHighlight]}>
                {progression.current1RM}
              </Text>
              <Text style={styles.statUnit}>{unit} (est. 1RM)</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Progress</Text>
              <Text style={[
                styles.statValue,
                progression.improvement1RMPercent > 0 ? styles.statValueSuccess : styles.statValueError
              ]}>
                {progression.improvement1RMPercent > 0 ? '+' : ''}{progression.improvement1RMPercent}%
              </Text>
              <Text style={styles.statUnit}>
                {progression.improvement1RM > 0 ? '+' : ''}{progression.improvement1RM} {unit}
              </Text>
            </View>
          </View>

          {/* Additional Info */}
          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Ionicons name="calendar-outline" size={16} color={colors.textSecondary} />
              <Text style={styles.infoText}>{progression.totalWorkouts} workouts tracked</Text>
            </View>
            <View style={styles.infoItem}>
              <Ionicons name="time-outline" size={16} color={colors.textSecondary} />
              <Text style={styles.infoText}>
                Since {new Date(progression.firstDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </Text>
            </View>
          </View>
        </>
      )}

      {/* Exercise Picker Modal */}
      {showPicker && renderExercisePicker()}
    </Card>
  )
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  selector: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  selectorLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  selectorValue: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectorText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  chartContainer: {
    overflow: 'hidden',
    marginHorizontal: -20,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  statBox: {
    flex: 1,
    backgroundColor: colors.surfaceElevated,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '500',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
  },
  statValueHighlight: {
    color: colors.primary,
  },
  statValueSuccess: {
    color: colors.success,
  },
  statValueError: {
    color: colors.error,
  },
  statUnit: {
    fontSize: 11,
    color: colors.textTertiary,
    marginTop: 2,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  infoText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginTop: 12,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 20,
  },
  // Picker Modal
  pickerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    padding: 20,
    zIndex: 100,
  },
  pickerContainer: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    maxHeight: '70%',
    overflow: 'hidden',
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  pickerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  pickerScroll: {
    maxHeight: 400,
  },
  pickerOption: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  pickerOptionSelected: {
    backgroundColor: colors.primaryMuted,
  },
  pickerOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pickerOptionText: {
    fontSize: 16,
    color: colors.text,
    fontWeight: '500',
  },
  pickerOptionTextSelected: {
    color: colors.primary,
    fontWeight: '600',
  },
  pickerOptionMeta: {
    fontSize: 13,
    color: colors.textTertiary,
    marginTop: 4,
  },
  improvementBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.successMuted,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  improvementText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.success,
  },
})

export default ExerciseProgressionChart
