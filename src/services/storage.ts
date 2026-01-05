import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState, User, WorkoutLog, DailyNutrition, DailySteps, DailyWeight, WeeklyStats, WorkoutTemplate, PersonalRecord } from '../types';
import { isDateInRange } from '../utils/dateUtils';

// Storage keys
const KEYS = {
  USER: '@fit_app_user',
  WORKOUTS: '@fit_app_workouts',
  NUTRITION: '@fit_app_nutrition',
  STEPS: '@fit_app_steps',
  TEMPLATES: '@fit_app_templates',
  PERSONAL_RECORDS: '@fit_app_personal_records',
  WEIGHTS: '@fit_app_weights',
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

// ============ BODY WEIGHT ============

export const getWeights = async (): Promise<DailyWeight[]> => {
  try {
    const data = await AsyncStorage.getItem(KEYS.WEIGHTS);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error getting weights:', error);
    return [];
  }
};

export const getWeightByDate = async (date: string): Promise<DailyWeight | null> => {
  const allWeights = await getWeights();
  return allWeights.find(w => w.date === date) || null;
};

export const saveWeight = async (weight: DailyWeight): Promise<void> => {
  try {
    const allWeights = await getWeights();
    const existingIndex = allWeights.findIndex(w => w.date === weight.date);

    if (existingIndex >= 0) {
      allWeights[existingIndex] = weight;
    } else {
      allWeights.push(weight);
    }

    await AsyncStorage.setItem(KEYS.WEIGHTS, JSON.stringify(allWeights));
  } catch (error) {
    console.error('Error saving weight:', error);
  }
};

export const deleteWeight = async (weightId: string): Promise<void> => {
  try {
    const weights = await getWeights();
    const filtered = weights.filter(w => w.id !== weightId);
    await AsyncStorage.setItem(KEYS.WEIGHTS, JSON.stringify(filtered));
  } catch (error) {
    console.error('Error deleting weight:', error);
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

// ============ PERSONAL RECORDS ============

export const getPersonalRecords = async (): Promise<PersonalRecord[]> => {
  try {
    const data = await AsyncStorage.getItem(KEYS.PERSONAL_RECORDS);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error getting personal records:', error);
    return [];
  }
};

export const savePersonalRecord = async (pr: PersonalRecord): Promise<void> => {
  try {
    const records = await getPersonalRecords();
    const existingIndex = records.findIndex(r => r.id === pr.id);

    if (existingIndex >= 0) {
      records[existingIndex] = pr;
    } else {
      records.push(pr);
    }

    await AsyncStorage.setItem(KEYS.PERSONAL_RECORDS, JSON.stringify(records));
  } catch (error) {
    console.error('Error saving personal record:', error);
  }
};

export const deletePersonalRecord = async (prId: string): Promise<void> => {
  try {
    const records = await getPersonalRecords();
    const filtered = records.filter(r => r.id !== prId);
    await AsyncStorage.setItem(KEYS.PERSONAL_RECORDS, JSON.stringify(filtered));
  } catch (error) {
    console.error('Error deleting personal record:', error);
  }
};

export const getPersonalRecordByExercise = async (exerciseName: string): Promise<PersonalRecord | null> => {
  const records = await getPersonalRecords();
  return records.find(r => r.exerciseName.toLowerCase() === exerciseName.toLowerCase()) || null;
};

/**
 * Check if a workout contains any new personal records and update them
 * @param workout The workout to check for PRs
 * @returns Array of new PRs that were set
 */
export const checkAndUpdatePRs = async (workout: WorkoutLog): Promise<PersonalRecord[]> => {
  const newPRs: PersonalRecord[] = [];
  const existingPRs = await getPersonalRecords();

  for (const exercise of workout.exercises) {
    // Find the best set in this exercise (highest weight × reps product, or just highest weight)
    let bestSet = exercise.sets[0];
    for (const set of exercise.sets) {
      if (set.weight > bestSet.weight ||
          (set.weight === bestSet.weight && set.reps > bestSet.reps)) {
        bestSet = set;
      }
    }

    // Check if this is a PR
    const existingPR = existingPRs.find(
      pr => pr.exerciseName.toLowerCase() === exercise.exerciseName.toLowerCase()
    );

    const isNewPR = !existingPR ||
                     bestSet.weight > existingPR.weight ||
                     (bestSet.weight === existingPR.weight && bestSet.reps > existingPR.reps);

    if (isNewPR && bestSet.weight > 0) {
      const newPR: PersonalRecord = {
        id: existingPR?.id || generateId(),
        userId: workout.userId,
        exerciseName: exercise.exerciseName,
        weight: bestSet.weight,
        reps: bestSet.reps,
        date: workout.date,
        workoutId: workout.id,
        created: new Date().toISOString(),
      };

      await savePersonalRecord(newPR);
      newPRs.push(newPR);
    }
  }

  return newPRs;
};

/**
 * Find the last time an exercise was performed (excluding a specific workout)
 * @param exerciseName Name of the exercise to search for
 * @param userId User ID to filter by
 * @param excludeWorkoutId Optional workout ID to exclude from search (for editing)
 * @returns Last exercise performance data or null
 */
export const getLastExercisePerformance = async (
  exerciseName: string,
  userId: string,
  excludeWorkoutId?: string
): Promise<{
  date: string;
  sets: number;
  reps: number;
  weight: number;
  workoutName: string;
} | null> => {
  try {
    const allWorkouts = await getWorkouts();

    // Filter by user and exclude current workout if provided
    const userWorkouts = allWorkouts.filter(
      w => w.userId === userId && w.id !== excludeWorkoutId
    );

    // Sort by date descending (most recent first)
    const sortedWorkouts = userWorkouts.sort((a, b) =>
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    // Find the first workout containing this exercise
    for (const workout of sortedWorkouts) {
      const exercise = workout.exercises.find(
        ex => ex.exerciseName.toLowerCase() === exerciseName.toLowerCase()
      );

      if (exercise && exercise.sets.length > 0) {
        const firstSet = exercise.sets[0];
        return {
          date: workout.date,
          sets: exercise.sets.length,
          reps: firstSet.reps,
          weight: firstSet.weight,
          workoutName: workout.name,
        };
      }
    }

    return null;
  } catch (error) {
    console.error('Error getting last exercise performance:', error);
    return null;
  }
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

export const getWeightsInRange = async (startDate: string, endDate: string): Promise<DailyWeight[]> => {
  const weights = await getWeights();
  return weights
    .filter(w => isDateInRange(w.date, startDate, endDate))
    .sort((a, b) => a.date.localeCompare(b.date)); // Sort chronologically
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
      KEYS.PERSONAL_RECORDS,
      KEYS.WEIGHTS,
    ]);
  } catch (error) {
    console.error('Error clearing data:', error);
  }
};
