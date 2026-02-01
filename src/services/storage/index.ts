/**
 * Storage Service - Modular SQLite Implementation
 *
 * This module re-exports all storage operations from domain-specific modules.
 * Provides data persistence using SQLite for efficient indexed queries.
 */

// Utilities
export { generateId, formatDate, getTodayDate } from './utils';

// User operations
export { getUser, saveUser, createDefaultUser } from './userStorage';

// Workout operations
export {
  getWorkouts,
  saveWorkout,
  deleteWorkout,
  getWorkoutsByDate,
  getWorkoutsInRange,
} from './workoutStorage';

// Nutrition operations
export {
  getNutrition,
  getNutritionByDate,
  saveNutrition,
  getNutritionInRange,
} from './nutritionStorage';

// Food preset operations
export {
  getPresets,
  getPresetById,
  savePreset,
  deletePreset,
  updatePresetLastUsed,
  getRecentPresets,
  createPreset,
} from './presetStorage';

// Steps operations
export {
  getSteps,
  getStepsByDate,
  saveSteps,
  getStepsInRange,
} from './stepsStorage';

// Weight operations
export {
  getWeights,
  getWeightByDate,
  saveWeight,
  deleteWeight,
  getWeightsInRange,
} from './weightStorage';

// Template operations
export {
  getTemplates,
  saveTemplate,
  deleteTemplate,
  getTemplateById,
} from './templateStorage';

// Personal Records operations
export {
  getPersonalRecords,
  savePersonalRecord,
  deletePersonalRecord,
  getPersonalRecordByExercise,
  checkAndUpdatePRs,
  getLastExercisePerformance,
} from './prStorage';

// Custom Exercises operations
export {
  getCustomExercises,
  saveCustomExercise,
  updateCustomExercise,
  deleteCustomExercise,
  getCustomExerciseById,
} from './exerciseStorage';

// Stats operations
export { calculateWeeklyStats } from './statsStorage';

// Achievement operations
export {
  getAchievements,
  saveAchievements,
  initializeAchievements,
  checkAndUpdateAchievements,
} from './achievementStorage';

// App operations
export { initializeApp, clearAllData } from './appStorage';
