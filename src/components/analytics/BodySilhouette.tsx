import React from 'react'
import { View, StyleSheet, TouchableOpacity } from 'react-native'
import Svg, { Path, G, Circle } from 'react-native-svg'
import { MuscleGroup, MuscleGroupScore } from '../../types'
import { colors } from '../../utils/theme'

// Intensity color mapping
const INTENSITY_COLORS = {
  none: colors.surfaceElevated,
  low: '#2D5A4A',
  medium: '#34D399',
  high: '#10B981'
}

// SVG paths for muscle group regions (front view, simplified anatomical)
const MUSCLE_PATHS = {
  // Head (decorative, not a muscle group)
  head: 'M100,8 C115,8 125,20 125,35 C125,50 115,60 100,60 C85,60 75,50 75,35 C75,20 85,8 100,8',
  // Neck
  neck: 'M90,60 L110,60 L108,75 L92,75 Z',

  // Chest - pectoral region
  Chest: 'M70,80 Q75,75 100,78 Q125,75 130,80 L130,110 Q115,115 100,112 Q85,115 70,110 Z',

  // Shoulders - deltoid caps
  Shoulders: 'M55,78 Q60,70 70,75 L70,95 Q60,95 55,90 Z M130,75 Q140,70 145,78 L145,90 Q140,95 130,95 Z',

  // Arms - biceps/triceps
  Arms: 'M50,95 L58,90 L62,140 L48,145 Z M138,90 L150,95 L152,145 L138,140 Z',

  // Forearms (part of arms)
  forearmLeft: 'M48,148 L62,143 L58,190 L45,188 Z',
  forearmRight: 'M138,143 L152,148 L155,188 L142,190 Z',

  // Core - abs region
  Core: 'M75,115 L125,115 L125,170 L75,170 Z',

  // Back - shown as side hints
  Back: 'M68,85 L72,85 L72,165 L68,165 Z M128,85 L132,85 L132,165 L128,165 Z',

  // Legs - quads and hamstrings
  Legs: 'M75,175 L95,175 L92,280 L72,280 Z M105,175 L125,175 L128,280 L108,280 Z',

  // Calves (part of legs)
  calfLeft: 'M72,285 L92,285 L88,340 L75,340 Z',
  calfRight: 'M108,285 L128,285 L125,340 L112,340 Z',
}

// Cardio is represented by a heart icon overlay
const CARDIO_PATH = 'M100,95 C95,88 85,88 85,98 C85,108 100,118 100,118 C100,118 115,108 115,98 C115,88 105,88 100,95'

interface BodySilhouetteProps {
  scores: MuscleGroupScore[]
  width?: number
  height?: number
  onMusclePress?: (muscle: MuscleGroup) => void
  selectedMuscle?: MuscleGroup | null
}

const BodySilhouette: React.FC<BodySilhouetteProps> = ({
  scores,
  width = 200,
  height = 350,
  onMusclePress,
  selectedMuscle
}) => {
  const getColor = (muscle: MuscleGroup): string => {
    const score = scores.find(s => s.name === muscle)
    return score ? INTENSITY_COLORS[score.intensity] : INTENSITY_COLORS.none
  }

  const getStrokeWidth = (muscle: MuscleGroup): number => {
    return selectedMuscle === muscle ? 2 : 0.5
  }

  const getStrokeColor = (muscle: MuscleGroup): string => {
    return selectedMuscle === muscle ? colors.primary : colors.border
  }

  // Scale factor for responsive sizing
  const scale = Math.min(width / 200, height / 350)

  return (
    <View style={styles.container}>
      <Svg
        width={width}
        height={height}
        viewBox="0 0 200 350"
      >
        {/* Body outline/silhouette base */}
        <G opacity={0.3}>
          <Path d={MUSCLE_PATHS.head} fill={colors.textTertiary} />
          <Path d={MUSCLE_PATHS.neck} fill={colors.textTertiary} />
        </G>

        {/* Muscle Group Regions */}
        <G>
          {/* Shoulders */}
          <Path
            d={MUSCLE_PATHS.Shoulders}
            fill={getColor('Shoulders')}
            stroke={getStrokeColor('Shoulders')}
            strokeWidth={getStrokeWidth('Shoulders')}
            onPress={() => onMusclePress?.('Shoulders')}
          />

          {/* Chest */}
          <Path
            d={MUSCLE_PATHS.Chest}
            fill={getColor('Chest')}
            stroke={getStrokeColor('Chest')}
            strokeWidth={getStrokeWidth('Chest')}
            onPress={() => onMusclePress?.('Chest')}
          />

          {/* Back (side indicators) */}
          <Path
            d={MUSCLE_PATHS.Back}
            fill={getColor('Back')}
            stroke={getStrokeColor('Back')}
            strokeWidth={getStrokeWidth('Back')}
            onPress={() => onMusclePress?.('Back')}
          />

          {/* Arms */}
          <G onPress={() => onMusclePress?.('Arms')}>
            <Path
              d={MUSCLE_PATHS.Arms}
              fill={getColor('Arms')}
              stroke={getStrokeColor('Arms')}
              strokeWidth={getStrokeWidth('Arms')}
            />
            <Path
              d={MUSCLE_PATHS.forearmLeft}
              fill={getColor('Arms')}
              stroke={getStrokeColor('Arms')}
              strokeWidth={getStrokeWidth('Arms')}
            />
            <Path
              d={MUSCLE_PATHS.forearmRight}
              fill={getColor('Arms')}
              stroke={getStrokeColor('Arms')}
              strokeWidth={getStrokeWidth('Arms')}
            />
          </G>

          {/* Core */}
          <Path
            d={MUSCLE_PATHS.Core}
            fill={getColor('Core')}
            stroke={getStrokeColor('Core')}
            strokeWidth={getStrokeWidth('Core')}
            onPress={() => onMusclePress?.('Core')}
          />

          {/* Legs */}
          <G onPress={() => onMusclePress?.('Legs')}>
            <Path
              d={MUSCLE_PATHS.Legs}
              fill={getColor('Legs')}
              stroke={getStrokeColor('Legs')}
              strokeWidth={getStrokeWidth('Legs')}
            />
            <Path
              d={MUSCLE_PATHS.calfLeft}
              fill={getColor('Legs')}
              stroke={getStrokeColor('Legs')}
              strokeWidth={getStrokeWidth('Legs')}
            />
            <Path
              d={MUSCLE_PATHS.calfRight}
              fill={getColor('Legs')}
              stroke={getStrokeColor('Legs')}
              strokeWidth={getStrokeWidth('Legs')}
            />
          </G>

          {/* Cardio (heart overlay) */}
          <Path
            d={CARDIO_PATH}
            fill={getColor('Cardio')}
            stroke={getStrokeColor('Cardio')}
            strokeWidth={getStrokeWidth('Cardio')}
            onPress={() => onMusclePress?.('Cardio')}
          />
        </G>
      </Svg>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center'
  }
})

export default React.memo(BodySilhouette)
