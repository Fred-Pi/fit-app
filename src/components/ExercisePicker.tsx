/**
 * ExercisePicker - Hierarchical exercise selection component
 *
 * Flow: Add Exercise → Select Body Area → Select Exercise → Configure → Add
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  EXERCISE_CATEGORIES,
  getExercisesByCategory,
  MuscleGroup,
  Exercise,
} from '../data/exercises';
import { colors, glass, radius, spacing, typography } from '../utils/theme';
import { lightHaptic } from '../utils/haptics';
import GlassCard from './GlassCard';

type PickerStep = 'closed' | 'category' | 'exercise' | 'configure';

interface ExercisePickerProps {
  onSelectExercise: (
    exerciseName: string,
    defaults?: { sets: number; reps: number }
  ) => void;
  existingExercises?: string[];
}

const ExercisePicker: React.FC<ExercisePickerProps> = ({
  onSelectExercise,
  existingExercises = [],
}) => {
  const [step, setStep] = useState<PickerStep>('closed');
  const [selectedCategory, setSelectedCategory] = useState<MuscleGroup | null>(null);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [sets, setSets] = useState(3);
  const [reps, setReps] = useState(10);
  const [weight, setWeight] = useState(0);

  const resetState = () => {
    setStep('closed');
    setSelectedCategory(null);
    setSelectedExercise(null);
    setSets(3);
    setReps(10);
    setWeight(0);
  };

  const handleOpenPicker = () => {
    lightHaptic();
    setStep('category');
  };

  const handleSelectCategory = (category: MuscleGroup) => {
    lightHaptic();
    setSelectedCategory(category);
    setStep('exercise');
  };

  const handleSelectExercise = (exercise: Exercise) => {
    lightHaptic();
    setSelectedExercise(exercise);
    // Pre-fill defaults from exercise database
    if (exercise.defaultSets) setSets(exercise.defaultSets);
    if (exercise.defaultReps) setReps(exercise.defaultReps);
    setStep('configure');
  };

  const handleConfirm = () => {
    if (!selectedExercise) return;
    lightHaptic();
    onSelectExercise(selectedExercise.name, { sets, reps });
    resetState();
  };

  const handleBack = () => {
    lightHaptic();
    if (step === 'exercise') {
      setStep('category');
      setSelectedCategory(null);
    } else if (step === 'configure') {
      setStep('exercise');
      setSelectedExercise(null);
    }
  };

  const handleClose = () => {
    lightHaptic();
    resetState();
  };

  const incrementValue = (
    setter: React.Dispatch<React.SetStateAction<number>>,
    current: number,
    amount: number,
    min: number = 0
  ) => {
    lightHaptic();
    setter(Math.max(min, current + amount));
  };

  // Get exercises for selected category, excluding already added ones
  const getAvailableExercises = () => {
    if (!selectedCategory) return [];
    const existingLower = existingExercises.map((e) => e.toLowerCase());
    return getExercisesByCategory(selectedCategory).filter(
      (ex) => !existingLower.includes(ex.name.toLowerCase())
    );
  };

  // Get category info for header
  const getCategoryInfo = () => {
    if (!selectedCategory) return null;
    return EXERCISE_CATEGORIES.find((c) => c.name === selectedCategory);
  };

  const renderCategoryStep = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Select Body Area</Text>
      <View style={styles.categoryGrid}>
        {EXERCISE_CATEGORIES.map((category) => (
          <TouchableOpacity
            key={category.name}
            style={[styles.categoryCard, { borderColor: category.color }]}
            onPress={() => handleSelectCategory(category.name)}
            activeOpacity={0.7}
          >
            <View style={[styles.categoryIcon, { backgroundColor: `${category.color}30` }]}>
              <Ionicons
                name={category.icon as any}
                size={28}
                color={category.color}
              />
            </View>
            <Text style={styles.categoryName}>{category.name}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderExerciseStep = () => {
    const exercises = getAvailableExercises();
    const categoryInfo = getCategoryInfo();

    return (
      <View style={styles.stepContent}>
        <View style={styles.exerciseHeader}>
          <View
            style={[
              styles.categoryBadge,
              { backgroundColor: `${categoryInfo?.color}30` },
            ]}
          >
            <Ionicons
              name={categoryInfo?.icon as any}
              size={16}
              color={categoryInfo?.color}
            />
            <Text style={[styles.categoryBadgeText, { color: categoryInfo?.color }]}>
              {selectedCategory}
            </Text>
          </View>
        </View>

        <Text style={styles.stepTitle}>Select Exercise</Text>

        <ScrollView style={styles.exerciseList} showsVerticalScrollIndicator={false}>
          {exercises.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="checkmark-circle" size={48} color={colors.success} />
              <Text style={styles.emptyStateText}>
                All exercises in this category have been added
              </Text>
            </View>
          ) : (
            exercises.map((exercise) => (
              <TouchableOpacity
                key={exercise.id}
                style={styles.exerciseItem}
                onPress={() => handleSelectExercise(exercise)}
                activeOpacity={0.7}
              >
                <View style={styles.exerciseItemInfo}>
                  <Text style={styles.exerciseName}>{exercise.name}</Text>
                  {exercise.defaultSets && exercise.defaultReps && (
                    <Text style={styles.exerciseDefaults}>
                      {exercise.defaultSets} sets × {exercise.defaultReps} reps
                    </Text>
                  )}
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      </View>
    );
  };

  const renderConfigureStep = () => {
    const categoryInfo = getCategoryInfo();

    return (
      <View style={styles.stepContent}>
        <View style={styles.configureHeader}>
          <View
            style={[
              styles.categoryBadge,
              { backgroundColor: `${categoryInfo?.color}30` },
            ]}
          >
            <Ionicons
              name={categoryInfo?.icon as any}
              size={16}
              color={categoryInfo?.color}
            />
            <Text style={[styles.categoryBadgeText, { color: categoryInfo?.color }]}>
              {selectedCategory}
            </Text>
          </View>
          <Text style={styles.selectedExerciseName}>{selectedExercise?.name}</Text>
        </View>

        <Text style={styles.stepTitle}>Configure Exercise</Text>

        <View style={styles.configureGrid}>
          {/* Sets */}
          <View style={styles.configureItem}>
            <Text style={styles.configureLabel}>Sets</Text>
            <View style={styles.configureControls}>
              <TouchableOpacity
                style={styles.configureButton}
                onPress={() => incrementValue(setSets, sets, -1, 1)}
              >
                <Ionicons name="remove" size={20} color={colors.text} />
              </TouchableOpacity>
              <Text style={styles.configureValue}>{sets}</Text>
              <TouchableOpacity
                style={styles.configureButton}
                onPress={() => incrementValue(setSets, sets, 1)}
              >
                <Ionicons name="add" size={20} color={colors.text} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Reps */}
          <View style={styles.configureItem}>
            <Text style={styles.configureLabel}>Reps</Text>
            <View style={styles.configureControls}>
              <TouchableOpacity
                style={styles.configureButton}
                onPress={() => incrementValue(setReps, reps, -1, 1)}
              >
                <Ionicons name="remove" size={20} color={colors.text} />
              </TouchableOpacity>
              <Text style={styles.configureValue}>{reps}</Text>
              <TouchableOpacity
                style={styles.configureButton}
                onPress={() => incrementValue(setReps, reps, 1)}
              >
                <Ionicons name="add" size={20} color={colors.text} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Weight */}
          <View style={styles.configureItem}>
            <Text style={styles.configureLabel}>Starting Weight (kg)</Text>
            <View style={styles.configureControls}>
              <TouchableOpacity
                style={styles.configureButton}
                onPress={() => incrementValue(setWeight, weight, -2.5)}
              >
                <Ionicons name="remove" size={20} color={colors.text} />
              </TouchableOpacity>
              <Text style={styles.configureValue}>{weight}</Text>
              <TouchableOpacity
                style={styles.configureButton}
                onPress={() => incrementValue(setWeight, weight, 2.5)}
              >
                <Ionicons name="add" size={20} color={colors.text} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={styles.confirmButton}
          onPress={handleConfirm}
          activeOpacity={0.8}
        >
          <Ionicons name="add-circle" size={20} color={colors.text} />
          <Text style={styles.confirmButtonText}>Add Exercise</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <>
      {/* Add Exercise Button */}
      <GlassCard style={styles.addButtonCard} padding="none">
        <TouchableOpacity
          style={styles.addButton}
          onPress={handleOpenPicker}
          activeOpacity={0.8}
        >
          <Ionicons name="add-circle" size={24} color={colors.primary} />
          <Text style={styles.addButtonText}>Add Exercise</Text>
        </TouchableOpacity>
      </GlassCard>

      {/* Modal */}
      <Modal
        visible={step !== 'closed'}
        animationType="slide"
        transparent={true}
        onRequestClose={handleClose}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Header */}
            <View style={styles.modalHeader}>
              {step !== 'category' ? (
                <TouchableOpacity style={styles.backButton} onPress={handleBack}>
                  <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
              ) : (
                <View style={styles.backButton} />
              )}

              <Text style={styles.modalTitle}>
                {step === 'category' && 'Add Exercise'}
                {step === 'exercise' && 'Select Exercise'}
                {step === 'configure' && 'Configure'}
              </Text>

              <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            {/* Content */}
            <ScrollView
              style={styles.modalScrollView}
              contentContainerStyle={styles.modalScrollContent}
              showsVerticalScrollIndicator={false}
            >
              {step === 'category' && renderCategoryStep()}
              {step === 'exercise' && renderExerciseStep()}
              {step === 'configure' && renderConfigureStep()}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  addButtonCard: {
    marginTop: spacing.lg,
    overflow: 'hidden',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    padding: spacing.lg,
  },
  addButtonText: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
    color: colors.primary,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.background,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    maxHeight: '90%',
    ...(Platform.OS === 'web' ? { maxWidth: 500, alignSelf: 'center', width: '100%' } : {}),
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: glass.border,
  },
  modalTitle: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.bold,
    color: colors.text,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalScrollView: {
    flex: 1,
  },
  modalScrollContent: {
    flexGrow: 1,
  },

  // Step Content
  stepContent: {
    padding: spacing.xl,
  },
  stepTitle: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.medium,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },

  // Category Grid
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  categoryCard: {
    width: '30%',
    minWidth: 100,
    flexGrow: 1,
    alignItems: 'center',
    backgroundColor: glass.backgroundLight,
    borderRadius: radius.lg,
    borderWidth: 2,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  categoryIcon: {
    width: 56,
    height: 56,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryName: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
    color: colors.text,
    textAlign: 'center',
  },

  // Exercise Header
  exerciseHeader: {
    marginBottom: spacing.md,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
  },
  categoryBadgeText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
  },

  // Exercise List
  exerciseList: {
    maxHeight: 400,
  },
  exerciseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: glass.backgroundLight,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: glass.border,
    padding: spacing.lg,
    marginBottom: spacing.sm,
  },
  exerciseItemInfo: {
    flex: 1,
  },
  exerciseName: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.medium,
    color: colors.text,
  },
  exerciseDefaults: {
    fontSize: typography.size.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  emptyState: {
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.md,
  },
  emptyStateText: {
    fontSize: typography.size.base,
    color: colors.textSecondary,
    textAlign: 'center',
  },

  // Configure
  configureHeader: {
    marginBottom: spacing.lg,
  },
  selectedExerciseName: {
    fontSize: typography.size.xl,
    fontWeight: typography.weight.bold,
    color: colors.text,
    marginTop: spacing.md,
  },
  configureGrid: {
    gap: spacing.lg,
  },
  configureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: glass.backgroundLight,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: glass.border,
    padding: spacing.lg,
  },
  configureLabel: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.medium,
    color: colors.text,
  },
  configureControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  configureButton: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    backgroundColor: colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  configureValue: {
    fontSize: typography.size.xl,
    fontWeight: typography.weight.bold,
    color: colors.text,
    minWidth: 50,
    textAlign: 'center',
  },
  confirmButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginTop: spacing.xl,
  },
  confirmButtonText: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.bold,
    color: colors.text,
  },
});

export default ExercisePicker;
