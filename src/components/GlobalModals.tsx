/**
 * GlobalModals - Centralized modal rendering
 *
 * All modals are rendered at the root level and controlled via UIStore.
 * This eliminates scattered modal state across screens.
 */

import React, { useCallback } from 'react';
import { Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  useUIStore,
  useUserStore,
  useWorkoutStore,
  useNutritionStore,
  useDailyTrackingStore,
} from '../stores';
import { WorkoutLog, Meal, WorkoutTemplate } from '../types';
import { getTodayDate } from '../services/storage';
import { successHaptic } from '../utils/haptics';

// Modal Components
import AddWorkoutModal from './AddWorkoutModal';
import EditWorkoutModal from './EditWorkoutModal';
import AddMealModal from './AddMealModal';
import EditMealModal from './EditMealModal';
import UpdateStepsModal from './UpdateStepsModal';
import UpdateWeightModal from './UpdateWeightModal';
import TemplatePicker from './TemplatePicker';
import ConfirmDialog from './ConfirmDialog';

const GlobalModals: React.FC = () => {
  // UI Store
  const activeModal = useUIStore((s) => s.activeModal);
  const closeModal = useUIStore((s) => s.closeModal);
  const editWorkoutData = useUIStore((s) => s.editWorkoutData);
  const editMealData = useUIStore((s) => s.editMealData);
  const selectedTemplate = useUIStore((s) => s.selectedTemplate);
  const confirmDialogConfig = useUIStore((s) => s.confirmDialogConfig);
  const openAddWorkout = useUIStore((s) => s.openAddWorkout);

  // User Store
  const user = useUserStore((s) => s.user);

  // Workout Store
  const addWorkout = useWorkoutStore((s) => s.addWorkout);
  const updateWorkout = useWorkoutStore((s) => s.updateWorkout);

  // Nutrition Store
  const addMeal = useNutritionStore((s) => s.addMeal);
  const updateMeal = useNutritionStore((s) => s.updateMeal);

  // Daily Tracking Store
  const todaySteps = useDailyTrackingStore((s) => s.todaySteps);
  const todayWeight = useDailyTrackingStore((s) => s.todayWeight);
  const updateSteps = useDailyTrackingStore((s) => s.updateSteps);
  const updateWeight = useDailyTrackingStore((s) => s.updateWeight);

  // Get today's date
  const date = getTodayDate();

  // Handlers
  const handleAddWorkout = useCallback(
    async (workout: WorkoutLog) => {
      const newPRs = await addWorkout(workout);
      closeModal();

      if (newPRs.length > 0) {
        successHaptic();
        const prNames = newPRs.map((pr) => `${pr.exerciseName}: ${pr.weight} x ${pr.reps}`).join('\n');
        Alert.alert(
          'New Personal Record!',
          `Congratulations! You set ${newPRs.length > 1 ? 'new PRs' : 'a new PR'}:\n\n${prNames}`
        );
      }
    },
    [addWorkout, closeModal]
  );

  const handleEditWorkout = useCallback(
    async (workout: WorkoutLog) => {
      await updateWorkout(workout);
      closeModal();
    },
    [updateWorkout, closeModal]
  );

  const handleAddMeal = useCallback(
    async (meal: Meal) => {
      await addMeal(meal);
      closeModal();
    },
    [addMeal, closeModal]
  );

  const handleEditMeal = useCallback(
    async (meal: Meal) => {
      await updateMeal(meal);
      closeModal();
    },
    [updateMeal, closeModal]
  );

  const handleUpdateSteps = useCallback(
    async (steps: number) => {
      await updateSteps(steps);
      closeModal();
    },
    [updateSteps, closeModal]
  );

  const handleUpdateWeight = useCallback(
    async (weight: number) => {
      await updateWeight(weight);
      closeModal();
    },
    [updateWeight, closeModal]
  );

  const handleSelectTemplate = useCallback(
    (template: WorkoutTemplate) => {
      closeModal();
      // Open add workout modal with the selected template
      openAddWorkout(template);
    },
    [closeModal, openAddWorkout]
  );

  const handleConfirmDialogConfirm = useCallback(async () => {
    if (confirmDialogConfig?.onConfirm) {
      await confirmDialogConfig.onConfirm();
    }
    closeModal();
  }, [confirmDialogConfig, closeModal]);

  // Don't render anything if no user
  if (!user) return null;

  return (
    <>
      {/* Add Workout Modal */}
      <AddWorkoutModal
        visible={activeModal === 'addWorkout'}
        onClose={closeModal}
        onSave={handleAddWorkout}
        date={date}
        userId={user.id}
        initialTemplate={selectedTemplate}
      />

      {/* Edit Workout Modal */}
      <EditWorkoutModal
        visible={activeModal === 'editWorkout'}
        onClose={closeModal}
        onSave={handleEditWorkout}
        workout={editWorkoutData}
      />

      {/* Add Meal Modal */}
      <AddMealModal
        visible={activeModal === 'addMeal'}
        onClose={closeModal}
        onSave={handleAddMeal}
      />

      {/* Edit Meal Modal */}
      <EditMealModal
        visible={activeModal === 'editMeal'}
        onClose={closeModal}
        onSave={handleEditMeal}
        meal={editMealData}
      />

      {/* Update Steps Modal */}
      <UpdateStepsModal
        visible={activeModal === 'updateSteps'}
        onClose={closeModal}
        onSave={handleUpdateSteps}
        currentSteps={todaySteps?.steps || 0}
      />

      {/* Update Weight Modal */}
      <UpdateWeightModal
        visible={activeModal === 'updateWeight'}
        onClose={closeModal}
        onSave={handleUpdateWeight}
        currentWeight={todayWeight?.weight || 0}
        unit={user.preferredWeightUnit}
      />

      {/* Template Picker */}
      <TemplatePicker
        visible={activeModal === 'templatePicker'}
        onClose={closeModal}
        onSelectTemplate={handleSelectTemplate}
      />

      {/* Confirm Dialog */}
      <ConfirmDialog
        visible={activeModal === 'confirmDialog'}
        title={confirmDialogConfig?.title || 'Confirm'}
        message={confirmDialogConfig?.message || ''}
        confirmText={confirmDialogConfig?.confirmText || 'Confirm'}
        cancelText={confirmDialogConfig?.cancelText || 'Cancel'}
        onConfirm={handleConfirmDialogConfirm}
        onCancel={closeModal}
        icon={confirmDialogConfig?.icon as keyof typeof Ionicons.glyphMap}
        iconColor={confirmDialogConfig?.iconColor}
      />
    </>
  );
};

export default GlobalModals;
