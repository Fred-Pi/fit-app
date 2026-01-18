import React, { useState } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, LayoutChangeEvent } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { colors } from '../../utils/theme'
import { MuscleGroup, MuscleGroupHeatmapData } from '../../types'
import { EXERCISE_CATEGORIES } from '../../data/exercises'
import Card from '../Card'
import BodySilhouette from './BodySilhouette'
import EmptyState from '../EmptyState'

interface MuscleGroupHeatmapProps {
  data: MuscleGroupHeatmapData
}

const INTENSITY_LABELS = {
  none: 'Not trained',
  low: 'Light',
  medium: 'Moderate',
  high: 'Heavy'
}

function formatRelativeDate(dateString: string): string {
  const date = new Date(dateString)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  date.setHours(0, 0, 0, 0)

  const diffDays = Math.floor(
    (today.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
  )

  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  return `${diffDays} days ago`
}

const MuscleGroupHeatmap: React.FC<MuscleGroupHeatmapProps> = ({ data }) => {
  const [selectedMuscle, setSelectedMuscle] = useState<MuscleGroup | null>(null)
  const [containerWidth, setContainerWidth] = useState(300)

  const onLayout = (event: LayoutChangeEvent) => {
    const { width } = event.nativeEvent.layout
    setContainerWidth(width)
  }

  const selectedScore = selectedMuscle
    ? data.scores.find(s => s.name === selectedMuscle)
    : null

  const getCategoryInfo = (muscle: MuscleGroup) => {
    return EXERCISE_CATEGORIES.find(c => c.name === muscle)
  }

  const handleMusclePress = (muscle: MuscleGroup) => {
    setSelectedMuscle(selectedMuscle === muscle ? null : muscle)
  }

  // Empty state
  if (data.totalSets === 0) {
    return (
      <Card>
        <Text style={styles.title}>Muscle Balance</Text>
        <Text style={styles.subtitle}>Last 7 days training focus</Text>
        <EmptyState
          icon="body-outline"
          iconSize={64}
          title="No workout data available"
          subtitle="Complete workouts to see your muscle group training balance"
        />
      </Card>
    )
  }

  return (
    <Card>
      <View style={styles.header}>
        <Text style={styles.title}>Muscle Balance</Text>
        <Text style={styles.subtitle}>Last 7 days training focus</Text>
      </View>

      <View onLayout={onLayout} style={styles.contentContainer}>
        {/* Body Visualization */}
        <View style={styles.bodyContainer}>
          <BodySilhouette
            scores={data.scores}
            width={Math.min(containerWidth * 0.45, 160)}
            height={280}
            onMusclePress={handleMusclePress}
            selectedMuscle={selectedMuscle}
          />
        </View>

        {/* Legend */}
        <View style={styles.legendContainer}>
          {data.scores.map(score => {
            const category = getCategoryInfo(score.name)
            const isSelected = selectedMuscle === score.name
            return (
              <TouchableOpacity
                key={score.name}
                style={[
                  styles.legendItem,
                  isSelected && styles.legendItemSelected
                ]}
                onPress={() => handleMusclePress(score.name)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={category?.icon as any || 'fitness-outline'}
                  size={16}
                  color={category?.color || colors.textSecondary}
                />
                <Text style={[
                  styles.legendText,
                  isSelected && styles.legendTextSelected
                ]}>
                  {score.name}
                </Text>
                <Text style={styles.legendSets}>
                  {score.sets > 0 ? `${score.sets}` : '-'}
                </Text>
              </TouchableOpacity>
            )
          })}
        </View>
      </View>

      {/* Selected Muscle Detail */}
      {selectedScore && (
        <View style={styles.detailCard}>
          <View style={styles.detailHeader}>
            <Ionicons
              name={getCategoryInfo(selectedScore.name)?.icon as any || 'fitness-outline'}
              size={20}
              color={getCategoryInfo(selectedScore.name)?.color}
            />
            <Text style={styles.detailTitle}>{selectedScore.name}</Text>
            <View style={[
              styles.intensityBadge,
              { backgroundColor: getIntensityColor(selectedScore.intensity) }
            ]}>
              <Text style={styles.intensityText}>
                {INTENSITY_LABELS[selectedScore.intensity]}
              </Text>
            </View>
          </View>
          <View style={styles.detailStats}>
            <View style={styles.detailStatItem}>
              <Text style={styles.detailStatValue}>{selectedScore.sets}</Text>
              <Text style={styles.detailStatLabel}>Sets</Text>
            </View>
            <View style={styles.detailStatDivider} />
            <View style={styles.detailStatItem}>
              <Text style={styles.detailStatValue}>{selectedScore.daysTrained}</Text>
              <Text style={styles.detailStatLabel}>Days</Text>
            </View>
            <View style={styles.detailStatDivider} />
            <View style={styles.detailStatItem}>
              <Text style={styles.detailStatValue}>
                {selectedScore.lastTrained
                  ? formatRelativeDate(selectedScore.lastTrained)
                  : 'Never'}
              </Text>
              <Text style={styles.detailStatLabel}>Last trained</Text>
            </View>
          </View>
        </View>
      )}

      {/* Color Legend */}
      <View style={styles.colorLegend}>
        <View style={styles.colorLegendItem}>
          <View style={[styles.colorDot, { backgroundColor: colors.surfaceElevated }]} />
          <Text style={styles.colorLegendText}>None</Text>
        </View>
        <View style={styles.colorLegendItem}>
          <View style={[styles.colorDot, { backgroundColor: '#2D5A4A' }]} />
          <Text style={styles.colorLegendText}>Light</Text>
        </View>
        <View style={styles.colorLegendItem}>
          <View style={[styles.colorDot, { backgroundColor: '#34D399' }]} />
          <Text style={styles.colorLegendText}>Moderate</Text>
        </View>
        <View style={styles.colorLegendItem}>
          <View style={[styles.colorDot, { backgroundColor: '#10B981' }]} />
          <Text style={styles.colorLegendText}>Heavy</Text>
        </View>
      </View>

      {/* Stats Section */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{data.totalSets}</Text>
          <Text style={styles.statLabel}>Total Sets</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, styles.successValue]}>
            {data.mostTrained || '-'}
          </Text>
          <Text style={styles.statLabel}>Most Trained</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{data.daysActive}/7</Text>
          <Text style={styles.statLabel}>Days Active</Text>
        </View>
      </View>

      {/* Needs Attention Banner */}
      {data.needsAttention.length > 0 && (
        <View style={styles.attentionBanner}>
          <Ionicons name="alert-circle-outline" size={18} color={colors.gold} />
          <Text style={styles.attentionText}>
            Needs attention: {data.needsAttention.join(', ')}
          </Text>
        </View>
      )}
    </Card>
  )
}

function getIntensityColor(intensity: 'none' | 'low' | 'medium' | 'high'): string {
  switch (intensity) {
    case 'high': return '#10B981'
    case 'medium': return '#34D399'
    case 'low': return '#2D5A4A'
    default: return colors.surfaceElevated
  }
}

const styles = StyleSheet.create({
  header: {
    marginBottom: 16
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: 0.2
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4
  },
  contentContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 280
  },
  bodyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  legendContainer: {
    flex: 1,
    paddingLeft: 8
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 8,
    marginBottom: 2
  },
  legendItemSelected: {
    backgroundColor: colors.surfaceElevated
  },
  legendText: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
    marginLeft: 8
  },
  legendTextSelected: {
    fontWeight: '600',
    color: colors.primary
  },
  legendSets: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '600',
    minWidth: 24,
    textAlign: 'right'
  },
  detailCard: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: 12,
    padding: 14,
    marginTop: 16
  },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8
  },
  detailTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    flex: 1
  },
  intensityBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12
  },
  intensityText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text
  },
  detailStats: {
    flexDirection: 'row',
    justifyContent: 'space-around'
  },
  detailStatItem: {
    alignItems: 'center',
    flex: 1
  },
  detailStatValue: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 2
  },
  detailStatLabel: {
    fontSize: 11,
    color: colors.textSecondary
  },
  detailStatDivider: {
    width: 1,
    backgroundColor: colors.border
  },
  colorLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border
  },
  colorLegendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  colorDot: {
    width: 10,
    height: 10,
    borderRadius: 5
  },
  colorLegendText: {
    fontSize: 11,
    color: colors.textSecondary
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border
  },
  statItem: {
    alignItems: 'center',
    flex: 1
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: 4
  },
  successValue: {
    color: colors.success
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500'
  },
  statDivider: {
    width: 1,
    backgroundColor: colors.border
  },
  attentionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: 'rgba(251, 191, 36, 0.1)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.3)',
    gap: 8
  },
  attentionText: {
    flex: 1,
    fontSize: 13,
    color: colors.gold,
    fontWeight: '500'
  },
  })

export default React.memo(MuscleGroupHeatmap)
