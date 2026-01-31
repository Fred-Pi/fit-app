/**
 * GlobalModals - Centralized modal rendering
 *
 * All modals are rendered at the root level and controlled via UIStore.
 * This eliminates scattered modal state across screens.
 *
 * Note: AddWorkoutModal has been replaced with a screen-based flow
 * (QuickStartScreen → ActiveWorkoutScreen → WorkoutCompleteScreen)
 */

import React, { useCallback } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import {
  useUIStore,
  useUserStore,
  useWorkoutStore,
  useNutritionStore,
  useDailyTrackingStore,
  useActiveWorkoutStore,
} from '../stores';
import { WorkoutLog, Meal, WorkoutTemplate } from '../types';

// Modal Components
import EditWorkoutModal from './EditWorkoutModal';
import AddMealModal from './AddMealModal';
import EditMealModal from './EditMealModal';
import UpdateStepsModal from './UpdateStepsModal';
import UpdateWeightModal from './UpdateWeightModal';
import TemplatePicker from './TemplatePicker';
import ConfirmDialog from './ConfirmDialog';
import WelcomeModal from './WelcomeModal';
import NamePromptModal from './NamePromptModal';

const GlobalModals: React.FC = () => {
  const navigation = useNavigation<any>();

  // UI Store
  const activeModal = useUIStore((s) => s.activeModal);
  const closeModal = useUIStore((s) => s.closeModal);
  const editWorkoutData = useUIStore((s) => s.editWorkoutData);
  const editMealData = useUIStore((s) => s.editMealData);
  const confirmDialogConfig = useUIStore((s) => s.confirmDialogConfig);

  // User Store
  const user = useUserStore((s) => s.user);
  const updateUser = useUserStore((s) => s.updateUser);
  const markNameSet = useUserStore((s) => s.markNameSet);

  // Active Workout Store
  const startWorkout = useActiveWorkoutStore((s) => s.startWorkout);

  // Workout Store
  const updateWorkout = useWorkoutStore((s) => s.updateWorkout);

  // Nutrition Store
  const addMeal = useNutritionStore((s) => s.addMeal);
  const updateMeal = useNutritionStore((s) => s.updateMeal);

  // Daily Tracking Store
  const todaySteps = useDailyTrackingStore((s) => s.todaySteps);
  const todayWeight = useDailyTrackingStore((s) => s.todayWeight);
  const updateSteps = useDailyTrackingStore((s) => s.updateSteps);
  const updateWeight = useDailyTrackingStore((s) => s.updateWeight);

  // Handlers
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
      // Start workout with the selected template and navigate to ActiveWorkout
      startWorkout(template);
      navigation.navigate('Workouts', {
        screen: 'ActiveWorkout',
        params: { templateId: template.id },
      });
    },
    [closeModal, startWorkout, navigation]
  );

  const handleConfirmDialogConfirm = useCallback(async () => {
    if (confirmDialogConfig?.onConfirm) {
      await confirmDialogConfig.onConfirm();
    }
    closeModal();
  }, [confirmDialogConfig, closeModal]);

  const handleNameSave = useCallback(
    async (name: string) => {
      await updateUser({ name });
      await markNameSet();
      closeModal();
    },
    [updateUser, markNameSet, closeModal]
  );

  // Don't render anything if no user
  if (!user) return null;

  return (
    <>
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

      {/* Welcome Modal */}
      <WelcomeModal
        visible={activeModal === 'welcome'}
        userName={user?.name || 'there'}
        onDismiss={closeModal}
      />

      {/* Name Prompt Modal */}
      <NamePromptModal
        visible={activeModal === 'namePrompt'}
        onSave={handleNameSave}
      />
    </>
  );
};

export default GlobalModals;
