/**
 * Stores Index - Re-exports all Zustand stores
 */

export { useAuthStore } from './authStore';
export { useUserStore } from './userStore';
export { useUIStore, type ModalType, type ConfirmDialogConfig } from './uiStore';
export { useWorkoutStore } from './workoutStore';
export { useTemplateStore } from './templateStore';
export { usePersonalRecordStore } from './personalRecordStore';
export { useCustomExerciseStore } from './customExerciseStore';
export { useNutritionStore } from './nutritionStore';
export { usePresetStore } from './presetStore';
export { useDailyTrackingStore } from './dailyTrackingStore';
export {
  useActiveWorkoutStore,
  type ActiveSetLog,
  type ActiveExerciseLog,
  type ExerciseHistoryData,
} from './activeWorkoutStore';
