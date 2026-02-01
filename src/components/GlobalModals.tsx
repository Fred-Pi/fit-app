/**
 * GlobalModals - Centralized modal rendering
 *
 * All modals are rendered at the root level and controlled via UIStore.
 * This eliminates scattered modal state across screens.
 *
 * Performance optimization: Only renders the active modal to prevent
 * unnecessary re-renders when store state changes.
 *
 * Note: AddWorkoutModal has been replaced with a screen-based flow
 * (QuickStartScreen → ActiveWorkoutScreen → WorkoutCompleteScreen)
 */

import React, { useCallback, useMemo } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { AppNavigationProp } from '../navigation/types';
import {
  useUIStore,
  useUserStore,
  useWorkoutStore,
  useNutritionStore,
  useDailyTrackingStore,
  useActiveWorkoutStore,
  usePresetStore,
} from '../stores';
import { WorkoutLog, Meal, WorkoutTemplate, FoodPreset } from '../types';

// Modal Components - lazy loaded only when needed
import EditWorkoutModal from './EditWorkoutModal';
import AddMealModal from './AddMealModal';
import EditMealModal from './EditMealModal';
import UpdateStepsModal from './UpdateStepsModal';
import UpdateWeightModal from './UpdateWeightModal';
import TemplatePicker from './TemplatePicker';
import ConfirmDialog from './ConfirmDialog';
import WelcomeModal from './WelcomeModal';
import NamePromptModal from './NamePromptModal';
import PresetPickerModal from './PresetPickerModal';
import PresetFormModal from './PresetFormModal';
import LogPresetModal from './LogPresetModal';
import ManagePresetsScreen from '../screens/ManagePresetsScreen';

// Modal types for conditional rendering
type ModalType =
  | 'editWorkout' | 'addMeal' | 'editMeal' | 'updateSteps' | 'updateWeight'
  | 'templatePicker' | 'confirmDialog' | 'welcome' | 'namePrompt'
  | 'presetPicker' | 'presetForm' | 'logPreset' | 'managePresets' | null;

const GlobalModals: React.FC = () => {
  const navigation = useNavigation<AppNavigationProp>();

  // UI Store - only subscribe to activeModal for conditional rendering
  const activeModal = useUIStore((s) => s.activeModal) as ModalType;
  const closeModal = useUIStore((s) => s.closeModal);

  // Conditionally get modal-specific data only when that modal is active
  const editWorkoutData = useUIStore((s) =>
    s.activeModal === 'editWorkout' ? s.editWorkoutData : null
  );
  const editMealData = useUIStore((s) =>
    s.activeModal === 'editMeal' ? s.editMealData : null
  );
  const confirmDialogConfig = useUIStore((s) =>
    s.activeModal === 'confirmDialog' ? s.confirmDialogConfig : null
  );
  const editPresetData = useUIStore((s) =>
    s.activeModal === 'presetForm' ? s.editPresetData : null
  );
  const selectedPresetForLog = useUIStore((s) =>
    s.activeModal === 'logPreset' ? s.selectedPresetForLog : null
  );

  // Actions are stable and don't cause re-renders
  const openAddMeal = useUIStore((s) => s.openAddMeal);
  const openPresetForm = useUIStore((s) => s.openPresetForm);
  const openLogPreset = useUIStore((s) => s.openLogPreset);
  const openManagePresets = useUIStore((s) => s.openManagePresets);

  // User Store - minimal subscriptions
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

  // Daily Tracking Store - only subscribe when relevant modal is active
  const todaySteps = useDailyTrackingStore((s) =>
    activeModal === 'updateSteps' ? s.todaySteps : null
  );
  const todayWeight = useDailyTrackingStore((s) =>
    activeModal === 'updateWeight' ? s.todayWeight : null
  );
  const updateSteps = useDailyTrackingStore((s) => s.updateSteps);
  const updateWeight = useDailyTrackingStore((s) => s.updateWeight);

  // Preset Store
  const addPreset = usePresetStore((s) => s.addPreset);
  const updatePreset = usePresetStore((s) => s.updatePreset);
  const markPresetUsed = usePresetStore((s) => s.markPresetUsed);

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

  // Preset handlers
  const handleSelectPreset = useCallback(
    (preset: FoodPreset) => {
      closeModal();
      openLogPreset(preset);
    },
    [closeModal, openLogPreset]
  );

  const handleLogPreset = useCallback(
    async (meal: Meal) => {
      await addMeal(meal);
      // Mark preset as used for "recent" sorting
      if (meal.presetId) {
        await markPresetUsed(meal.presetId);
      }
      closeModal();
    },
    [addMeal, markPresetUsed, closeModal]
  );

  const handleSavePreset = useCallback(
    async (data: Omit<FoodPreset, 'id' | 'userId' | 'createdAt' | 'lastUsedAt'>) => {
      if (editPresetData) {
        // Update existing preset
        await updatePreset({
          ...editPresetData,
          ...data,
        });
      } else {
        // Create new preset
        await addPreset(data);
      }
      closeModal();
    },
    [editPresetData, addPreset, updatePreset, closeModal]
  );

  const handleSaveAsPresetFromMeal = useCallback(
    async (data: Omit<FoodPreset, 'id' | 'userId' | 'createdAt' | 'lastUsedAt'>) => {
      await addPreset(data);
    },
    [addPreset]
  );

  const handleQuickEntry = useCallback(() => {
    openAddMeal();
  }, [openAddMeal]);

  const handleCreatePreset = useCallback(() => {
    openPresetForm();
  }, [openPresetForm]);

  const handleEditPreset = useCallback(
    (preset: FoodPreset) => {
      openPresetForm(preset);
    },
    [openPresetForm]
  );

  const handleOpenManagePresets = useCallback(() => {
    openManagePresets();
  }, [openManagePresets]);

  // Don't render anything if no user or no active modal
  if (!user) return null;

  // Conditionally render only the active modal to prevent unnecessary re-renders
  // This is a significant performance optimization over rendering all modals
  const renderActiveModal = () => {
    switch (activeModal) {
      case 'editWorkout':
        return (
          <EditWorkoutModal
            visible={true}
            onClose={closeModal}
            onSave={handleEditWorkout}
            workout={editWorkoutData}
          />
        );

      case 'addMeal':
        return (
          <AddMealModal
            visible={true}
            onClose={closeModal}
            onSave={handleAddMeal}
            onSaveAsPreset={handleSaveAsPresetFromMeal}
          />
        );

      case 'editMeal':
        return (
          <EditMealModal
            visible={true}
            onClose={closeModal}
            onSave={handleEditMeal}
            meal={editMealData}
          />
        );

      case 'updateSteps':
        return (
          <UpdateStepsModal
            visible={true}
            onClose={closeModal}
            onSave={handleUpdateSteps}
            currentSteps={todaySteps?.steps || 0}
          />
        );

      case 'updateWeight':
        return (
          <UpdateWeightModal
            visible={true}
            onClose={closeModal}
            onSave={handleUpdateWeight}
            currentWeight={todayWeight?.weight || 0}
            unit={user.preferredWeightUnit}
          />
        );

      case 'templatePicker':
        return (
          <TemplatePicker
            visible={true}
            onClose={closeModal}
            onSelectTemplate={handleSelectTemplate}
          />
        );

      case 'confirmDialog':
        return (
          <ConfirmDialog
            visible={true}
            title={confirmDialogConfig?.title || 'Confirm'}
            message={confirmDialogConfig?.message || ''}
            confirmText={confirmDialogConfig?.confirmText || 'Confirm'}
            cancelText={confirmDialogConfig?.cancelText || 'Cancel'}
            onConfirm={handleConfirmDialogConfirm}
            onCancel={closeModal}
            icon={confirmDialogConfig?.icon as keyof typeof Ionicons.glyphMap}
            iconColor={confirmDialogConfig?.iconColor}
          />
        );

      case 'welcome':
        return (
          <WelcomeModal
            visible={true}
            userName={user?.name || 'there'}
            onDismiss={closeModal}
          />
        );

      case 'namePrompt':
        return (
          <NamePromptModal
            visible={true}
            onSave={handleNameSave}
          />
        );

      case 'presetPicker':
        return (
          <PresetPickerModal
            visible={true}
            onClose={closeModal}
            onSelectPreset={handleSelectPreset}
            onQuickEntry={handleQuickEntry}
            onCreatePreset={handleCreatePreset}
            onManagePresets={handleOpenManagePresets}
          />
        );

      case 'presetForm':
        return (
          <PresetFormModal
            visible={true}
            onClose={closeModal}
            onSave={handleSavePreset}
            preset={editPresetData}
          />
        );

      case 'logPreset':
        return (
          <LogPresetModal
            visible={true}
            onClose={closeModal}
            onLog={handleLogPreset}
            preset={selectedPresetForLog}
          />
        );

      case 'managePresets':
        return (
          <ManagePresetsScreen
            visible={true}
            onClose={closeModal}
            onEditPreset={handleEditPreset}
            onCreatePreset={handleCreatePreset}
          />
        );

      default:
        return null;
    }
  };

  return <>{renderActiveModal()}</>;
};

export default GlobalModals;
