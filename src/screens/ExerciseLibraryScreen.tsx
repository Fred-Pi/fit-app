import React, { useState, useEffect, useMemo, useCallback } from 'react'
import {
  View,
  Text,
  StyleSheet,
  SectionList,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native'
import { useFocusEffect, useNavigation } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import { Ionicons } from '@expo/vector-icons'
import { Exercise, MuscleGroup } from '../types'
import { EXERCISE_CATEGORIES } from '../data/exercises'
import { getCustomExercises, saveCustomExercise, deleteCustomExercise, getWorkouts, saveWorkout } from '../services/storage'
import { getAllExercises, isCustomExercise, getExerciseUsageCount, updateExerciseNameInWorkouts } from '../utils/exerciseHelpers'
import SearchBar from '../components/SearchBar'
import FilterChip from '../components/FilterChip'
import ExerciseCard from '../components/ExerciseCard'
import AddCustomExerciseModal from '../components/AddCustomExerciseModal'
import EditCustomExerciseModal from '../components/EditCustomExerciseModal'
import SwipeableRow from '../components/SwipeableRow'
import ExpandableFAB from '../components/ExpandableFAB'

type ExercisesStackParamList = {
  ExerciseLibrary: undefined
  ExerciseDetail: { exerciseId: string }
}

type ExerciseLibraryScreenNavigationProp = StackNavigationProp<
  ExercisesStackParamList,
  'ExerciseLibrary'
>

interface ExerciseSection {
  title: string
  icon: string
  color: string
  data: Exercise[]
}

type ViewFilter = 'all' | 'built-in' | 'custom'

const ExerciseLibraryScreen = () => {
  const navigation = useNavigation<ExerciseLibraryScreenNavigationProp>()

  const [customExercises, setCustomExercises] = useState<Exercise[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<MuscleGroup | 'All'>('All')
  const [viewFilter, setViewFilter] = useState<ViewFilter>('all')
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null)

  const loadCustomExercises = async () => {
    try {
      const exercises = await getCustomExercises()
      setCustomExercises(exercises)
    } catch (error) {
      console.error('Error loading custom exercises:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    loadCustomExercises()
  }, [])

  useFocusEffect(
    useCallback(() => {
      loadCustomExercises()
    }, [])
  )

  const onRefresh = () => {
    setRefreshing(true)
    loadCustomExercises()
  }

  // Get all exercises (built-in + custom)
  const allExercises = useMemo(() => {
    return getAllExercises(customExercises)
  }, [customExercises])

  // Filter exercises based on search, category, and view filter
  const filteredExercises = useMemo(() => {
    let exercises = allExercises

    // Apply view filter
    if (viewFilter === 'built-in') {
      exercises = exercises.filter(ex => !isCustomExercise(ex.id))
    } else if (viewFilter === 'custom') {
      exercises = exercises.filter(ex => isCustomExercise(ex.id))
    }

    // Apply category filter
    if (selectedCategory !== 'All') {
      exercises = exercises.filter(ex => ex.category === selectedCategory)
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      exercises = exercises.filter(ex =>
        ex.name.toLowerCase().includes(query)
      )
    }

    return exercises
  }, [allExercises, searchQuery, selectedCategory, viewFilter])

  // Group exercises by category
  const exerciseSections = useMemo<ExerciseSection[]>(() => {
    const sections: ExerciseSection[] = []

    EXERCISE_CATEGORIES.forEach(category => {
      const categoryExercises = filteredExercises.filter(
        exercise => exercise.category === category.name
      )

      if (categoryExercises.length > 0) {
        sections.push({
          title: category.name,
          icon: category.icon,
          color: category.color,
          data: categoryExercises,
        })
      }
    })

    return sections
  }, [filteredExercises])

  const handleAddExercise = async (exercise: Exercise) => {
    await saveCustomExercise(exercise)
    await loadCustomExercises()
  }

  const handleEditExercise = async (
    exercise: Exercise,
    shouldUpdateWorkouts: boolean
  ) => {
    // Update the exercise
    await saveCustomExercise(exercise)

    // If name changed and should update workouts, update all workout references
    if (shouldUpdateWorkouts && selectedExercise) {
      const workouts = await getWorkouts()
      const updatedWorkouts = updateExerciseNameInWorkouts(
        selectedExercise.name,
        exercise.name,
        workouts
      )

      // Save all updated workouts
      for (const workout of updatedWorkouts) {
        await saveWorkout(workout)
      }
    }

    await loadCustomExercises()
    setSelectedExercise(null)
  }

  const handleDeleteExercise = async (exercise: Exercise) => {
    const workouts = await getWorkouts()
    const usageCount = getExerciseUsageCount(exercise.name, workouts)

    const message =
      usageCount > 0
        ? `This exercise is used in ${usageCount} workout(s). Deleting it won't remove it from those workouts, but you won't be able to add it to new workouts.`
        : 'Are you sure you want to delete this exercise?'

    Alert.alert('Delete Exercise', message, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteCustomExercise(exercise.id)
          await loadCustomExercises()
        },
      },
    ])
  }

  const renderExerciseItem = ({ item }: { item: Exercise }) => {
    const isCustom = isCustomExercise(item.id)

    if (isCustom) {
      return (
        <SwipeableRow
          onEdit={() => {
            setSelectedExercise(item)
            setShowEditModal(true)
          }}
          onDelete={() => handleDeleteExercise(item)}
        >
          <ExerciseCard
            exercise={item}
            onPress={() =>
              navigation.navigate('ExerciseDetail', { exerciseId: item.id })
            }
          />
        </SwipeableRow>
      )
    }

    return (
      <ExerciseCard
        exercise={item}
        onPress={() =>
          navigation.navigate('ExerciseDetail', { exerciseId: item.id })
        }
      />
    )
  }

  const renderSectionHeader = ({ section }: { section: ExerciseSection }) => (
    <View style={styles.sectionHeader}>
      <Ionicons name={section.icon as any} size={20} color={section.color} />
      <Text style={styles.sectionHeaderText}>{section.title}</Text>
      <Text style={styles.sectionCount}>({section.data.length})</Text>
    </View>
  )

  const categories: Array<MuscleGroup | 'All'> = ['All', ...EXERCISE_CATEGORIES.map(c => c.name)]

  const viewFilters: Array<{ key: ViewFilter; label: string }> = [
    { key: 'all', label: 'All' },
    { key: 'built-in', label: 'Built-in' },
    { key: 'custom', label: 'Custom' },
  ]

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search exercises..."
        />

        <View style={styles.filtersContainer}>
          <Text style={styles.filterLabel}>Category:</Text>
          <View style={styles.filterChipsRow}>
            {categories.map(category => {
              const isAll = category === 'All'
              const categoryData = isAll
                ? null
                : EXERCISE_CATEGORIES.find(c => c.name === category)

              return (
                <FilterChip
                  key={category}
                  label={category}
                  active={selectedCategory === category}
                  onPress={() => setSelectedCategory(category)}
                  icon={categoryData?.icon}
                  color={categoryData?.color}
                />
              )
            })}
          </View>
        </View>

        <View style={styles.filtersContainer}>
          <Text style={styles.filterLabel}>View:</Text>
          <View style={styles.filterChipsRow}>
            {viewFilters.map(filter => (
              <FilterChip
                key={filter.key}
                label={filter.label}
                active={viewFilter === filter.key}
                onPress={() => setViewFilter(filter.key)}
              />
            ))}
          </View>
        </View>
      </View>

      {exerciseSections.length > 0 ? (
        <SectionList
          sections={exerciseSections}
          renderItem={renderExerciseItem}
          renderSectionHeader={renderSectionHeader}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContainer}
          stickySectionHeadersEnabled
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#3A9BFF"
            />
          }
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Ionicons name="barbell-outline" size={80} color="#3A3A42" />
          <Text style={styles.emptyTitle}>No Exercises Found</Text>
          <Text style={styles.emptyText}>
            {searchQuery || selectedCategory !== 'All' || viewFilter !== 'all'
              ? 'Try adjusting your filters'
              : 'Add your first custom exercise to get started'}
          </Text>
          {(searchQuery || selectedCategory !== 'All' || viewFilter !== 'all') && (
            <TouchableOpacity
              style={styles.clearFiltersButton}
              onPress={() => {
                setSearchQuery('')
                setSelectedCategory('All')
                setViewFilter('all')
              }}
            >
              <Text style={styles.clearFiltersText}>Clear Filters</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      <ExpandableFAB
        actions={[
          {
            icon: 'add',
            label: 'New Exercise',
            onPress: () => setShowAddModal(true),
          },
        ]}
      />

      <AddCustomExerciseModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSave={handleAddExercise}
        allExercises={allExercises}
      />

      <EditCustomExerciseModal
        visible={showEditModal}
        onClose={() => {
          setShowEditModal(false)
          setSelectedExercise(null)
        }}
        onSave={handleEditExercise}
        exercise={selectedExercise}
        allExercises={allExercises}
        workouts={[]} // Will be loaded in modal when needed
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0E0E14',
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
    padding: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#3A3A42',
  },
  filtersContainer: {
    marginTop: 16,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#A0A0A8',
    marginBottom: 8,
  },
  filterChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  listContainer: {
    padding: 20,
    paddingBottom: 100,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#1E1E22',
    borderRadius: 8,
    marginBottom: 12,
  },
  sectionHeaderText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    flex: 1,
  },
  sectionCount: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  clearFiltersButton: {
    marginTop: 24,
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: '#3A9BFF',
    borderRadius: 8,
  },
  clearFiltersText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
})

export default ExerciseLibraryScreen
