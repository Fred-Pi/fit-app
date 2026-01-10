import React, { useState, useEffect, useCallback } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { User, DailyWeight } from '../../types'
import { getWeights } from '../../services/storage'
import { calculateOneRepMax, generateRepTable } from '../../utils/oneRepMax'
import {
  getExercisesWithStandards,
  calculateStrengthLevel,
  getStrengthTargets,
  STRENGTH_LEVEL_COLORS,
  STRENGTH_LEVEL_DESCRIPTIONS,
  StrengthLevel,
} from '../../utils/strengthStandards'
import Card from '../Card'

interface StrengthCalculatorProps {
  user: User | null
}

const StrengthCalculator: React.FC<StrengthCalculatorProps> = ({ user }) => {
  const [selectedExercise, setSelectedExercise] = useState('Bench Press')
  const [weight, setWeight] = useState('')
  const [reps, setReps] = useState('')
  const [gender, setGender] = useState<'male' | 'female'>('male')
  const [bodyWeight, setBodyWeight] = useState<number | null>(null)
  const [showExercisePicker, setShowExercisePicker] = useState(false)
  const [showRepTable, setShowRepTable] = useState(false)

  const exercises = getExercisesWithStandards()
  const unit = user?.preferredWeightUnit || 'lbs'

  useEffect(() => {
    loadLatestBodyWeight()
  }, [])

  const loadLatestBodyWeight = async () => {
    const weights = await getWeights()
    if (weights.length > 0) {
      const sorted = weights.sort((a, b) => b.date.localeCompare(a.date))
      setBodyWeight(sorted[0].weight)
    }
  }

  const weightNum = parseFloat(weight) || 0
  const repsNum = parseInt(reps) || 0

  const oneRepMaxResult = weightNum > 0 && repsNum > 0
    ? calculateOneRepMax(weightNum, repsNum)
    : null

  const strengthResult = oneRepMaxResult && bodyWeight
    ? calculateStrengthLevel(oneRepMaxResult.average, bodyWeight, selectedExercise, gender)
    : null

  const targets = bodyWeight
    ? getStrengthTargets(selectedExercise, bodyWeight, gender)
    : null

  const repTable = oneRepMaxResult
    ? generateRepTable(oneRepMaxResult.average)
    : null

  const renderExercisePicker = () => (
    <View style={styles.pickerOverlay}>
      <View style={styles.pickerContainer}>
        <View style={styles.pickerHeader}>
          <Text style={styles.pickerTitle}>Select Exercise</Text>
          <TouchableOpacity onPress={() => setShowExercisePicker(false)}>
            <Ionicons name="close" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
        {exercises.map(exercise => (
          <TouchableOpacity
            key={exercise}
            style={[
              styles.pickerOption,
              selectedExercise === exercise && styles.pickerOptionSelected,
            ]}
            onPress={() => {
              setSelectedExercise(exercise)
              setShowExercisePicker(false)
            }}
          >
            <Text
              style={[
                styles.pickerOptionText,
                selectedExercise === exercise && styles.pickerOptionTextSelected,
              ]}
            >
              {exercise}
            </Text>
            {selectedExercise === exercise && (
              <Ionicons name="checkmark" size={20} color="#3A9BFF" />
            )}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  )

  const renderStrengthLevelBar = () => {
    if (!targets || !strengthResult) return null

    const levels: StrengthLevel[] = ['Beginner', 'Novice', 'Intermediate', 'Advanced', 'Elite']
    const currentLevelIndex = levels.indexOf(strengthResult.level)

    return (
      <View style={styles.levelBarContainer}>
        <View style={styles.levelBar}>
          {levels.map((level, index) => {
            const isActive = index <= currentLevelIndex
            const isCurrent = index === currentLevelIndex
            return (
              <View
                key={level}
                style={[
                  styles.levelSegment,
                  { backgroundColor: isActive ? STRENGTH_LEVEL_COLORS[level] : '#2C2C2E' },
                  isCurrent && styles.levelSegmentCurrent,
                ]}
              />
            )
          })}
        </View>
        <View style={styles.levelLabels}>
          {levels.map((level) => (
            <Text
              key={level}
              style={[
                styles.levelLabel,
                strengthResult.level === level && styles.levelLabelActive,
              ]}
            >
              {level.substring(0, 3)}
            </Text>
          ))}
        </View>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Ionicons name="barbell" size={32} color="#3A9BFF" />
        <View style={styles.headerText}>
          <Text style={styles.title}>Strength Calculator</Text>
          <Text style={styles.subtitle}>Calculate your 1RM and strength level</Text>
        </View>
      </View>

      {/* Gender Toggle */}
      <View style={styles.genderToggle}>
        <TouchableOpacity
          style={[styles.genderButton, gender === 'male' && styles.genderButtonActive]}
          onPress={() => setGender('male')}
        >
          <Text style={[styles.genderButtonText, gender === 'male' && styles.genderButtonTextActive]}>
            Male
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.genderButton, gender === 'female' && styles.genderButtonActive]}
          onPress={() => setGender('female')}
        >
          <Text style={[styles.genderButtonText, gender === 'female' && styles.genderButtonTextActive]}>
            Female
          </Text>
        </TouchableOpacity>
      </View>

      {/* Body Weight Display */}
      {bodyWeight ? (
        <View style={styles.bodyWeightBanner}>
          <Ionicons name="body-outline" size={18} color="#3A9BFF" />
          <Text style={styles.bodyWeightText}>
            Using body weight: <Text style={styles.bodyWeightValue}>{bodyWeight} {unit}</Text>
          </Text>
        </View>
      ) : (
        <View style={styles.warningBanner}>
          <Ionicons name="warning-outline" size={18} color="#FFD60A" />
          <Text style={styles.warningText}>
            Log your body weight to see strength standards
          </Text>
        </View>
      )}

      {/* Exercise Selector */}
      <TouchableOpacity
        style={styles.exerciseSelector}
        onPress={() => setShowExercisePicker(true)}
      >
        <Text style={styles.exerciseSelectorLabel}>Exercise</Text>
        <View style={styles.exerciseSelectorValue}>
          <Text style={styles.exerciseSelectorText}>{selectedExercise}</Text>
          <Ionicons name="chevron-down" size={20} color="#98989D" />
        </View>
      </TouchableOpacity>

      {/* Input Fields */}
      <View style={styles.inputRow}>
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Weight ({unit})</Text>
          <TextInput
            style={styles.input}
            value={weight}
            onChangeText={setWeight}
            placeholder="0"
            placeholderTextColor="#666"
            keyboardType="numeric"
          />
        </View>
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Reps</Text>
          <TextInput
            style={styles.input}
            value={reps}
            onChangeText={setReps}
            placeholder="0"
            placeholderTextColor="#666"
            keyboardType="numeric"
          />
        </View>
      </View>

      {/* 1RM Result */}
      {oneRepMaxResult && (
        <Card>
          <View style={styles.resultHeader}>
            <Ionicons name="trophy" size={24} color="#FFD60A" />
            <Text style={styles.resultTitle}>Estimated 1RM</Text>
          </View>
          <Text style={styles.resultValue}>
            {oneRepMaxResult.average} <Text style={styles.resultUnit}>{unit}</Text>
          </Text>
          <View style={styles.formulaResults}>
            <View style={styles.formulaItem}>
              <Text style={styles.formulaLabel}>Epley</Text>
              <Text style={styles.formulaValue}>{oneRepMaxResult.epley}</Text>
            </View>
            <View style={styles.formulaItem}>
              <Text style={styles.formulaLabel}>Brzycki</Text>
              <Text style={styles.formulaValue}>{oneRepMaxResult.brzycki}</Text>
            </View>
            <View style={styles.formulaItem}>
              <Text style={styles.formulaLabel}>Lander</Text>
              <Text style={styles.formulaValue}>{oneRepMaxResult.lander}</Text>
            </View>
            <View style={styles.formulaItem}>
              <Text style={styles.formulaLabel}>Lombardi</Text>
              <Text style={styles.formulaValue}>{oneRepMaxResult.lombardi}</Text>
            </View>
          </View>
        </Card>
      )}

      {/* Strength Level */}
      {strengthResult && (
        <Card>
          <View style={styles.strengthHeader}>
            <View style={styles.strengthTitleRow}>
              <Text style={styles.strengthTitle}>Strength Level</Text>
              <View
                style={[
                  styles.levelBadge,
                  { backgroundColor: STRENGTH_LEVEL_COLORS[strengthResult.level] },
                ]}
              >
                <Text style={styles.levelBadgeText}>{strengthResult.level}</Text>
              </View>
            </View>
            <Text style={styles.ratioText}>
              {strengthResult.ratio}x body weight
            </Text>
          </View>

          {renderStrengthLevelBar()}

          <Text style={styles.levelDescription}>
            {STRENGTH_LEVEL_DESCRIPTIONS[strengthResult.level]}
          </Text>

          {strengthResult.nextLevel && (
            <View style={styles.nextLevelContainer}>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${strengthResult.progressToNext}%` },
                  ]}
                />
              </View>
              <Text style={styles.nextLevelText}>
                {strengthResult.progressToNext}% to {strengthResult.nextLevel} ({strengthResult.targetForNext} {unit})
              </Text>
            </View>
          )}
        </Card>
      )}

      {/* Strength Targets */}
      {targets && (
        <Card>
          <Text style={styles.targetsTitle}>Strength Targets</Text>
          <Text style={styles.targetsSubtitle}>
            Based on your body weight of {bodyWeight} {unit}
          </Text>
          <View style={styles.targetsList}>
            {targets.map(target => (
              <View key={target.level} style={styles.targetItem}>
                <View style={styles.targetLeft}>
                  <View
                    style={[
                      styles.targetDot,
                      { backgroundColor: STRENGTH_LEVEL_COLORS[target.level] },
                    ]}
                  />
                  <Text style={styles.targetLabel}>{target.level}</Text>
                </View>
                <Text style={styles.targetValue}>{target.weight} {unit}</Text>
              </View>
            ))}
          </View>
        </Card>
      )}

      {/* Rep Table Toggle */}
      {repTable && (
        <TouchableOpacity
          style={styles.repTableToggle}
          onPress={() => setShowRepTable(!showRepTable)}
        >
          <Text style={styles.repTableToggleText}>
            {showRepTable ? 'Hide' : 'Show'} Rep Percentage Table
          </Text>
          <Ionicons
            name={showRepTable ? 'chevron-up' : 'chevron-down'}
            size={20}
            color="#3A9BFF"
          />
        </TouchableOpacity>
      )}

      {/* Rep Table */}
      {showRepTable && repTable && (
        <Card>
          <Text style={styles.repTableTitle}>Training Weights</Text>
          <Text style={styles.repTableSubtitle}>
            Based on {oneRepMaxResult?.average} {unit} 1RM
          </Text>
          <View style={styles.repTableHeader}>
            <Text style={styles.repTableHeaderText}>Reps</Text>
            <Text style={styles.repTableHeaderText}>Weight</Text>
            <Text style={styles.repTableHeaderText}>%1RM</Text>
          </View>
          {repTable.map(row => (
            <View key={row.reps} style={styles.repTableRow}>
              <Text style={styles.repTableCell}>{row.reps}</Text>
              <Text style={styles.repTableCellWeight}>{row.weight} {unit}</Text>
              <Text style={styles.repTableCell}>{row.percentage}%</Text>
            </View>
          ))}
        </Card>
      )}

      {/* Exercise Picker Modal */}
      {showExercisePicker && renderExercisePicker()}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 20,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 15,
    color: '#98989D',
  },
  genderToggle: {
    flexDirection: 'row',
    backgroundColor: '#1C1C1E',
    borderRadius: 10,
    padding: 4,
    marginBottom: 16,
  },
  genderButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  genderButtonActive: {
    backgroundColor: '#3A9BFF',
  },
  genderButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#98989D',
  },
  genderButtonTextActive: {
    color: '#FFFFFF',
  },
  bodyWeightBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#0F1A2E',
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
  },
  bodyWeightText: {
    fontSize: 14,
    color: '#98989D',
  },
  bodyWeightValue: {
    color: '#3A9BFF',
    fontWeight: '600',
  },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 214, 10, 0.1)',
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
  },
  warningText: {
    fontSize: 14,
    color: '#FFD60A',
  },
  exerciseSelector: {
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  exerciseSelectorLabel: {
    fontSize: 12,
    color: '#98989D',
    marginBottom: 4,
  },
  exerciseSelectorValue: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  exerciseSelectorText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  inputRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  inputContainer: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 12,
    color: '#98989D',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    padding: 16,
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  resultValue: {
    fontSize: 48,
    fontWeight: '800',
    color: '#FFD60A',
    textAlign: 'center',
    marginBottom: 16,
  },
  resultUnit: {
    fontSize: 24,
    color: '#98989D',
    fontWeight: '600',
  },
  formulaResults: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: '#2C2C2E',
    paddingTop: 16,
  },
  formulaItem: {
    alignItems: 'center',
  },
  formulaLabel: {
    fontSize: 11,
    color: '#98989D',
    marginBottom: 4,
  },
  formulaValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  strengthHeader: {
    marginBottom: 16,
  },
  strengthTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  strengthTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  levelBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  levelBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#000000',
  },
  ratioText: {
    fontSize: 14,
    color: '#98989D',
  },
  levelBarContainer: {
    marginBottom: 16,
  },
  levelBar: {
    flexDirection: 'row',
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    gap: 2,
    marginBottom: 8,
  },
  levelSegment: {
    flex: 1,
    borderRadius: 2,
  },
  levelSegmentCurrent: {
    transform: [{ scaleY: 1.3 }],
  },
  levelLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  levelLabel: {
    fontSize: 10,
    color: '#666',
    fontWeight: '500',
  },
  levelLabelActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  levelDescription: {
    fontSize: 14,
    color: '#98989D',
    lineHeight: 20,
    marginBottom: 16,
  },
  nextLevelContainer: {
    backgroundColor: '#2C2C2E',
    padding: 12,
    borderRadius: 10,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#1C1C1E',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#3A9BFF',
    borderRadius: 3,
  },
  nextLevelText: {
    fontSize: 13,
    color: '#98989D',
    textAlign: 'center',
  },
  targetsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  targetsSubtitle: {
    fontSize: 13,
    color: '#98989D',
    marginBottom: 16,
  },
  targetsList: {
    gap: 12,
  },
  targetItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  targetLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  targetDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  targetLabel: {
    fontSize: 15,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  targetValue: {
    fontSize: 15,
    color: '#98989D',
    fontWeight: '600',
  },
  repTableToggle: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 16,
  },
  repTableToggleText: {
    fontSize: 14,
    color: '#3A9BFF',
    fontWeight: '600',
  },
  repTableTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  repTableSubtitle: {
    fontSize: 13,
    color: '#98989D',
    marginBottom: 16,
  },
  repTableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#2C2C2E',
    paddingBottom: 8,
    marginBottom: 8,
  },
  repTableHeaderText: {
    flex: 1,
    fontSize: 12,
    color: '#98989D',
    fontWeight: '600',
    textAlign: 'center',
  },
  repTableRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#1C1C1E',
  },
  repTableCell: {
    flex: 1,
    fontSize: 14,
    color: '#98989D',
    textAlign: 'center',
  },
  repTableCellWeight: {
    flex: 1,
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
    textAlign: 'center',
  },
  // Exercise Picker Modal
  pickerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    padding: 20,
    zIndex: 100,
  },
  pickerContainer: {
    backgroundColor: '#1C1C1E',
    borderRadius: 16,
    padding: 20,
    maxHeight: '80%',
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2C2C2E',
  },
  pickerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  pickerOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#2C2C2E',
  },
  pickerOptionSelected: {
    backgroundColor: 'rgba(58, 155, 255, 0.1)',
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
  pickerOptionText: {
    fontSize: 16,
    color: '#FFFFFF',
  },
  pickerOptionTextSelected: {
    color: '#3A9BFF',
    fontWeight: '600',
  },
})

export default StrengthCalculator
