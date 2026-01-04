import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState, User, WorkoutLog, DailyNutrition, DailySteps, WeeklyStats, WorkoutTemplate } from '../types';
import { isDateInRange } from '../utils/dateUtils';

// Storage keys
const KEYS = {
  USER: '@fit_app_user',
  WORKOUTS: '@fit_app_workouts',
  NUTRITION: '@fit_app_nutrition',
  STEPS: '@fit_app_steps',
  TEMPLATES: '@fit_app_templates',
};

// ============ USER ============

export const getUser = async (): Promise<User | null> => {
  try {
    const data = await AsyncStorage.getItem(KEYS.USER);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Error getting user:', error);
    return null;
  }
};

export const saveUser = async (user: User): Promise<void> => {
  try {
    await AsyncStorage.setItem(KEYS.USER, JSON.stringify(user));
  } catch (error) {
    console.error('Error saving user:', error);
  }
};

export const createDefaultUser = (): User => {
  return {
    id: generateId(),
    name: 'User',
    dailyCalorieTarget: 2200,
    dailyStepGoal: 10000,
    preferredWeightUnit: 'lbs',
    created: new Date().toISOString(),
  };
};

// ============ WORKOUTS ============

export const getWorkouts = async (): Promise<WorkoutLog[]> => {
  try {
    const data = await AsyncStorage.getItem(KEYS.WORKOUTS);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error getting workouts:', error);
    return [];
  }
};

export const saveWorkout = async (workout: WorkoutLog): Promise<void> => {
  try {
    const workouts = await getWorkouts();
    const existingIndex = workouts.findIndex(w => w.id === workout.id);

    if (existingIndex >= 0) {
      workouts[existingIndex] = workout;
    } else {
      workouts.push(workout);
    }

    await AsyncStorage.setItem(KEYS.WORKOUTS, JSON.stringify(workouts));
  } catch (error) {
    console.error('Error saving workout:', error);
  }
};

export const deleteWorkout = async (workoutId: string): Promise<void> => {
  try {
    const workouts = await getWorkouts();
    const filtered = workouts.filter(w => w.id !== workoutId);
    await AsyncStorage.setItem(KEYS.WORKOUTS, JSON.stringify(filtered));
  } catch (error) {
    console.error('Error deleting workout:', error);
  }
};

export const getWorkoutsByDate = async (date: string): Promise<WorkoutLog[]> => {
  const workouts = await getWorkouts();
  return workouts.filter(w => w.date === date);
};

// ============ NUTRITION ============

export const getNutrition = async (): Promise<DailyNutrition[]> => {
  try {
    const data = await AsyncStorage.getItem(KEYS.NUTRITION);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error getting nutrition:', error);
    return [];
  }
};

export const getNutritionByDate = async (date: string): Promise<DailyNutrition | null> => {
  const allNutrition = await getNutrition();
  return allNutrition.find(n => n.date === date) || null;
};

export const saveNutrition = async (nutrition: DailyNutrition): Promise<void> => {
  try {
    const allNutrition = await getNutrition();
    const existingIndex = allNutrition.findIndex(n => n.date === nutrition.date);

    if (existingIndex >= 0) {
      allNutrition[existingIndex] = nutrition;
    } else {
      allNutrition.push(nutrition);
    }

    await AsyncStorage.setItem(KEYS.NUTRITION, JSON.stringify(allNutrition));
  } catch (error) {
    console.error('Error saving nutrition:', error);
  }
};

// ============ STEPS ============

export const getSteps = async (): Promise<DailySteps[]> => {
  try {
    const data = await AsyncStorage.getItem(KEYS.STEPS);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error getting steps:', error);
    return [];
  }
};

export const getStepsByDate = async (date: string): Promise<DailySteps | null> => {
  const allSteps = await getSteps();
  return allSteps.find(s => s.date === date) || null;
};

export const saveSteps = async (steps: DailySteps): Promise<void> => {
  try {
    const allSteps = await getSteps();
    const existingIndex = allSteps.findIndex(s => s.date === steps.date);

    if (existingIndex >= 0) {
      allSteps[existingIndex] = steps;
    } else {
      allSteps.push(steps);
    }

    await AsyncStorage.setItem(KEYS.STEPS, JSON.stringify(allSteps));
  } catch (error) {
    console.error('Error saving steps:', error);
  }
};

// ============ WORKOUT TEMPLATES ============

export const getTemplates = async (): Promise<WorkoutTemplate[]> => {
  try {
    const data = await AsyncStorage.getItem(KEYS.TEMPLATES);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error getting templates:', error);
    return [];
  }
};

export const saveTemplate = async (template: WorkoutTemplate): Promise<void> => {
  try {
    const templates = await getTemplates();
    const existingIndex = templates.findIndex(t => t.id === template.id);

    if (existingIndex >= 0) {
      templates[existingIndex] = template;
    } else {
      templates.push(template);
    }

    await AsyncStorage.setItem(KEYS.TEMPLATES, JSON.stringify(templates));
  } catch (error) {
    console.error('Error saving template:', error);
  }
};

export const deleteTemplate = async (templateId: string): Promise<void> => {
  try {
    const templates = await getTemplates();
    const filtered = templates.filter(t => t.id !== templateId);
    await AsyncStorage.setItem(KEYS.TEMPLATES, JSON.stringify(filtered));
  } catch (error) {
    console.error('Error deleting template:', error);
  }
};

export const getTemplateById = async (templateId: string): Promise<WorkoutTemplate | null> => {
  const templates = await getTemplates();
  return templates.find(t => t.id === templateId) || null;
};

// ============ DATE RANGE QUERIES ============

/**
 * Get all workouts within a date range (inclusive)
 * @param startDate Start date in YYYY-MM-DD format
 * @param endDate End date in YYYY-MM-DD format
 * @returns Array of workouts within the range
 */
export const getWorkoutsInRange = async (startDate: string, endDate: string): Promise<WorkoutLog[]> => {
  const workouts = await getWorkouts();
  return workouts.filter(w => isDateInRange(w.date, startDate, endDate));
};

/**
 * Get all nutrition data within a date range (inclusive)
 * @param startDate Start date in YYYY-MM-DD format
 * @param endDate End date in YYYY-MM-DD format
 * @returns Array of nutrition data within the range
 */
export const getNutritionInRange = async (startDate: string, endDate: string): Promise<DailyNutrition[]> => {
  const nutrition = await getNutrition();
  return nutrition.filter(n => isDateInRange(n.date, startDate, endDate));
};

/**
 * Get all steps data within a date range (inclusive)
 * @param startDate Start date in YYYY-MM-DD format
 * @param endDate End date in YYYY-MM-DD format
 * @returns Array of steps data within the range
 */
export const getStepsInRange = async (startDate: string, endDate: string): Promise<DailySteps[]> => {
  const steps = await getSteps();
  return steps.filter(s => isDateInRange(s.date, startDate, endDate));
};

/**
 * Calculate weekly statistics for a given week
 * @param weekStart Start of week in YYYY-MM-DD format
 * @param weekEnd End of week in YYYY-MM-DD format
 * @param user User object for targets/goals
 * @returns Weekly statistics object
 */
export const calculateWeeklyStats = async (
  weekStart: string,
  weekEnd: string,
  user: User
): Promise<WeeklyStats> => {
  // Get data for the week
  const workouts = await getWorkoutsInRange(weekStart, weekEnd);
  const nutrition = await getNutritionInRange(weekStart, weekEnd);
  const steps = await getStepsInRange(weekStart, weekEnd);

  // Calculate workout stats
  const totalWorkouts = workouts.filter(w => w.completed).length;
  const uniqueWorkoutDates = new Set(workouts.map(w => w.date));
  const daysActive = uniqueWorkoutDates.size;

  // Calculate nutrition stats
  const totalCalories = nutrition.reduce((sum, n) => {
    const dailyTotal = n.meals.reduce((mealSum, meal) => mealSum + meal.calories, 0);
    return sum + dailyTotal;
  }, 0);
  const avgCalories = nutrition.length > 0 ? Math.round(totalCalories / nutrition.length) : 0;
  const calorieTarget = user.dailyCalorieTarget * 7;

  // Calculate steps stats
  const totalSteps = steps.reduce((sum, s) => sum + s.steps, 0);
  const avgSteps = steps.length > 0 ? Math.round(totalSteps / steps.length) : 0;
  const stepGoal = user.dailyStepGoal * 7;

  return {
    weekStart,
    weekEnd,
    totalWorkouts,
    totalCalories,
    avgCalories,
    calorieTarget,
    totalSteps,
    avgSteps,
    stepGoal,
    daysActive,
  };
};

// ============ UTILITIES ============

export const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

export const formatDate = (date: Date): string => {
  return date.toISOString().split('T')[0]; // YYYY-MM-DD
};

export const getTodayDate = (): string => {
  return formatDate(new Date());
};

// ============ INITIALIZATION ============

export const initializeApp = async (): Promise<User> => {
  let user = await getUser();

  if (!user) {
    user = createDefaultUser();
    await saveUser(user);
  }

  return user;
};

// Clear all data (for testing/reset)
export const clearAllData = async (): Promise<void> => {
  try {
    await AsyncStorage.multiRemove([
      KEYS.USER,
      KEYS.WORKOUTS,
      KEYS.NUTRITION,
      KEYS.STEPS,
      KEYS.TEMPLATES,
    ]);
  } catch (error) {
    console.error('Error clearing data:', error);
  }
};
