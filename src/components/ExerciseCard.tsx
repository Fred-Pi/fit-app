import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Exercise } from '../types'
import { EXERCISE_CATEGORIES } from '../data/exercises'
import { isCustomExercise } from '../utils/exerciseHelpers'
import Card from './Card'

interface ExerciseCardProps {
  exercise: Exercise
  onPress: () => void
}

const ExerciseCard: React.FC<ExerciseCardProps> = ({ exercise, onPress }) => {
  const category = EXERCISE_CATEGORIES.find(cat => cat.name === exercise.category)
  const isCustom = isCustomExercise(exercise.id)

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <Card>
        <View style={styles.container}>
          <View style={styles.iconContainer}>
            <Ionicons
              name={category?.icon as any || 'barbell'}
              size={24}
              color={category?.color || '#A0A0A8'}
            />
          </View>

          <View style={styles.content}>
            <View style={styles.headerRow}>
              <Text style={styles.name}>{exercise.name}</Text>
              {isCustom && (
                <View style={styles.customBadge}>
                  <Text style={styles.customBadgeText}>Custom</Text>
                </View>
              )}
            </View>

            <View style={styles.metaRow}>
              <Text style={styles.category}>{exercise.category}</Text>
              {(exercise.defaultSets || exercise.defaultReps) && (
                <>
                  <Text style={styles.separator}>•</Text>
                  <Text style={styles.defaults}>
                    {exercise.defaultSets && `${exercise.defaultSets} sets`}
                    {exercise.defaultSets && exercise.defaultReps && ' × '}
                    {exercise.defaultReps && `${exercise.defaultReps} reps`}
                  </Text>
                </>
              )}
            </View>
          </View>

          <Ionicons name="chevron-forward" size={20} color="#666" />
        </View>
      </Card>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2A2A30',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    flex: 1,
  },
  customBadge: {
    backgroundColor: '#A855F7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  customBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
    textTransform: 'uppercase',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  category: {
    fontSize: 14,
    color: '#A0A0A8',
    fontWeight: '500',
  },
  separator: {
    fontSize: 14,
    color: '#666',
  },
  defaults: {
    fontSize: 14,
    color: '#A0A0A8',
  },
})

export default ExerciseCard
