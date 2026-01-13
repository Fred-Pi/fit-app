/**
 * Storage Service - SQLite Implementation
 *
 * Provides data persistence using SQLite for efficient indexed queries.
 * Maintains the same API as the original AsyncStorage implementation.
 */

import { getDatabase } from './database';
import {
  User,
  WorkoutLog,
  ExerciseLog,
  SetLog,
  DailyNutrition,
  Meal,
  DailySteps,
  DailyWeight,
  WeeklyStats,
  WorkoutTemplate,
  ExerciseTemplate,
  PersonalRecord,
  Exercise,
  Achievement,
  MuscleGroup,
} from '../types';
import { getWeekDates } from '../utils/dateUtils';
import { achievementDefinitions } from '../data/achievements';
import { calculateWorkoutStreak } from '../utils/analyticsCalculations';

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

// Helper to check if date is in range
const isDateInRange = (date: string, start: string, end: string): boolean => {
  return date >= start && date <= end;
};

// ============ USER ============

export const getUser = async (): Promise<User | null> => {
  try {
    const db = await getDatabase();
    const row = await db.getFirstAsync<{
      id: string;
      name: string;
      email: string | null;
      daily_calorie_target: number;
      daily_step_goal: number;
      preferred_weight_unit: 'kg' | 'lbs';
      goal_weight: number | null;
      created: string;
    }>('SELECT * FROM users LIMIT 1');

    if (!row) return null;

    return {
      id: row.id,
      name: row.name,
      email: row.email || undefined,
      dailyCalorieTarget: row.daily_calorie_target,
      dailyStepGoal: row.daily_step_goal,
      preferredWeightUnit: row.preferred_weight_unit,
      goalWeight: row.goal_weight || undefined,
      created: row.created,
    };
  } catch (error) {
    console.error('Error getting user:', error);
    return null;
  }
};

export const saveUser = async (user: User): Promise<void> => {
  try {
    const db = await getDatabase();
    await db.runAsync(
      `INSERT OR REPLACE INTO users (id, name, email, daily_calorie_target, daily_step_goal, preferred_weight_unit, goal_weight, created)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [user.id, user.name, user.email || null, user.dailyCalorieTarget, user.dailyStepGoal, user.preferredWeightUnit, user.goalWeight || null, user.created]
    );
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

// Helper to load exercises and sets for a workout
const loadWorkoutExercises = async (workoutId: string): Promise<ExerciseLog[]> => {
  const db = await getDatabase();

  const exerciseRows = await db.getAllAsync<{
    id: string;
    exercise_name: string;
    notes: string | null;
    order_index: number;
  }>(
    'SELECT * FROM exercise_logs WHERE workout_id = ? ORDER BY order_index',
    [workoutId]
  );

  const exercises: ExerciseLog[] = [];

  for (const exRow of exerciseRows) {
    const setRows = await db.getAllAsync<{
      reps: number;
      weight: number;
      rpe: number | null;
      completed: number;
    }>(
      'SELECT reps, weight, rpe, completed FROM set_logs WHERE exercise_log_id = ? ORDER BY order_index',
      [exRow.id]
    );

    const sets: SetLog[] = setRows.map(s => ({
      reps: s.reps,
      weight: s.weight,
      rpe: s.rpe || undefined,
      completed: s.completed === 1,
    }));

    exercises.push({
      id: exRow.id,
      exerciseName: exRow.exercise_name,
      notes: exRow.notes || undefined,
      sets,
    });
  }

  return exercises;
};

// Helper to convert workout row to WorkoutLog
const rowToWorkoutLog = async (row: {
  id: string;
  user_id: string;
  date: string;
  name: string;
  duration: number | null;
  notes: string | null;
  completed: number;
  created: string;
}): Promise<WorkoutLog> => {
  const exercises = await loadWorkoutExercises(row.id);

  return {
    id: row.id,
    userId: row.user_id,
    date: row.date,
    name: row.name,
    duration: row.duration || undefined,
    notes: row.notes || undefined,
    completed: row.completed === 1,
    created: row.created,
    exercises,
  };
};

export const getWorkouts = async (): Promise<WorkoutLog[]> => {
  try {
    const db = await getDatabase();
    const rows = await db.getAllAsync<{
      id: string;
      user_id: string;
      date: string;
      name: string;
      duration: number | null;
      notes: string | null;
      completed: number;
      created: string;
    }>('SELECT * FROM workout_logs ORDER BY date DESC, created DESC');

    return Promise.all(rows.map(rowToWorkoutLog));
  } catch (error) {
    console.error('Error getting workouts:', error);
    return [];
  }
};

export const saveWorkout = async (workout: WorkoutLog): Promise<void> => {
  try {
    const db = await getDatabase();

    await db.withTransactionAsync(async () => {
      // Insert/update workout
      await db.runAsync(
        `INSERT OR REPLACE INTO workout_logs (id, user_id, date, name, duration, notes, completed, created)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [workout.id, workout.userId, workout.date, workout.name, workout.duration || null, workout.notes || null, workout.completed ? 1 : 0, workout.created]
      );

      // Delete existing exercises (cascade deletes sets)
      await db.runAsync('DELETE FROM exercise_logs WHERE workout_id = ?', [workout.id]);

      // Insert exercises and sets
      for (let i = 0; i < workout.exercises.length; i++) {
        const ex = workout.exercises[i];
        await db.runAsync(
          `INSERT INTO exercise_logs (id, workout_id, exercise_name, notes, order_index)
           VALUES (?, ?, ?, ?, ?)`,
          [ex.id, workout.id, ex.exerciseName, ex.notes || null, i]
        );

        for (let j = 0; j < ex.sets.length; j++) {
          const set = ex.sets[j];
          await db.runAsync(
            `INSERT INTO set_logs (id, exercise_log_id, reps, weight, rpe, completed, order_index)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [generateId(), ex.id, set.reps, set.weight, set.rpe || null, set.completed ? 1 : 0, j]
          );
        }
      }
    });
  } catch (error) {
    console.error('Error saving workout:', error);
  }
};

export const deleteWorkout = async (workoutId: string): Promise<void> => {
  try {
    const db = await getDatabase();
    // Cascade delete handles exercises and sets
    await db.runAsync('DELETE FROM workout_logs WHERE id = ?', [workoutId]);
  } catch (error) {
    console.error('Error deleting workout:', error);
  }
};

export const getWorkoutsByDate = async (date: string): Promise<WorkoutLog[]> => {
  try {
    const db = await getDatabase();
    const rows = await db.getAllAsync<{
      id: string;
      user_id: string;
      date: string;
      name: string;
      duration: number | null;
      notes: string | null;
      completed: number;
      created: string;
    }>(
      'SELECT * FROM workout_logs WHERE date = ? ORDER BY created DESC',
      [date]
    );

    return Promise.all(rows.map(rowToWorkoutLog));
  } catch (error) {
    console.error('Error getting workouts by date:', error);
    return [];
  }
};

export const getWorkoutsInRange = async (startDate: string, endDate: string): Promise<WorkoutLog[]> => {
  try {
    const db = await getDatabase();
    const rows = await db.getAllAsync<{
      id: string;
      user_id: string;
      date: string;
      name: string;
      duration: number | null;
      notes: string | null;
      completed: number;
      created: string;
    }>(
      'SELECT * FROM workout_logs WHERE date BETWEEN ? AND ? ORDER BY date DESC',
      [startDate, endDate]
    );

    return Promise.all(rows.map(rowToWorkoutLog));
  } catch (error) {
    console.error('Error getting workouts in range:', error);
    return [];
  }
};

// ============ NUTRITION ============

const loadNutritionMeals = async (nutritionId: string): Promise<Meal[]> => {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{
    id: string;
    name: string;
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
    time: string;
  }>(
    'SELECT * FROM meals WHERE nutrition_id = ? ORDER BY time',
    [nutritionId]
  );

  return rows.map(r => ({
    id: r.id,
    name: r.name,
    calories: r.calories,
    protein: r.protein,
    carbs: r.carbs,
    fats: r.fats,
    time: r.time,
  }));
};

export const getNutrition = async (): Promise<DailyNutrition[]> => {
  try {
    const db = await getDatabase();
    const rows = await db.getAllAsync<{
      id: string;
      user_id: string;
      date: string;
      calorie_target: number;
    }>('SELECT * FROM daily_nutrition ORDER BY date DESC');

    const results: DailyNutrition[] = [];
    for (const row of rows) {
      const meals = await loadNutritionMeals(row.id);
      results.push({
        id: row.id,
        userId: row.user_id,
        date: row.date,
        calorieTarget: row.calorie_target,
        meals,
      });
    }
    return results;
  } catch (error) {
    console.error('Error getting nutrition:', error);
    return [];
  }
};

export const getNutritionByDate = async (date: string): Promise<DailyNutrition | null> => {
  try {
    const db = await getDatabase();
    const row = await db.getFirstAsync<{
      id: string;
      user_id: string;
      date: string;
      calorie_target: number;
    }>(
      'SELECT * FROM daily_nutrition WHERE date = ?',
      [date]
    );

    if (!row) return null;

    const meals = await loadNutritionMeals(row.id);
    return {
      id: row.id,
      userId: row.user_id,
      date: row.date,
      calorieTarget: row.calorie_target,
      meals,
    };
  } catch (error) {
    console.error('Error getting nutrition by date:', error);
    return null;
  }
};

export const saveNutrition = async (nutrition: DailyNutrition): Promise<void> => {
  try {
    const db = await getDatabase();

    await db.withTransactionAsync(async () => {
      // Insert/update nutrition record
      await db.runAsync(
        `INSERT OR REPLACE INTO daily_nutrition (id, user_id, date, calorie_target)
         VALUES (?, ?, ?, ?)`,
        [nutrition.id, nutrition.userId, nutrition.date, nutrition.calorieTarget]
      );

      // Delete existing meals
      await db.runAsync('DELETE FROM meals WHERE nutrition_id = ?', [nutrition.id]);

      // Insert meals
      for (const meal of nutrition.meals) {
        await db.runAsync(
          `INSERT INTO meals (id, nutrition_id, name, calories, protein, carbs, fats, time)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [meal.id, nutrition.id, meal.name, meal.calories, meal.protein, meal.carbs, meal.fats, meal.time]
        );
      }
    });
  } catch (error) {
    console.error('Error saving nutrition:', error);
  }
};

export const getNutritionInRange = async (startDate: string, endDate: string): Promise<DailyNutrition[]> => {
  try {
    const db = await getDatabase();
    const rows = await db.getAllAsync<{
      id: string;
      user_id: string;
      date: string;
      calorie_target: number;
    }>(
      'SELECT * FROM daily_nutrition WHERE date BETWEEN ? AND ? ORDER BY date',
      [startDate, endDate]
    );

    const results: DailyNutrition[] = [];
    for (const row of rows) {
      const meals = await loadNutritionMeals(row.id);
      results.push({
        id: row.id,
        userId: row.user_id,
        date: row.date,
        calorieTarget: row.calorie_target,
        meals,
      });
    }
    return results;
  } catch (error) {
    console.error('Error getting nutrition in range:', error);
    return [];
  }
};

// ============ STEPS ============

export const getSteps = async (): Promise<DailySteps[]> => {
  try {
    const db = await getDatabase();
    const rows = await db.getAllAsync<{
      id: string;
      user_id: string;
      date: string;
      steps: number;
      step_goal: number;
      source: string;
    }>('SELECT * FROM daily_steps ORDER BY date DESC');

    return rows.map(r => ({
      id: r.id,
      userId: r.user_id,
      date: r.date,
      steps: r.steps,
      stepGoal: r.step_goal,
      source: r.source as 'manual' | 'apple_health' | 'google_fit',
    }));
  } catch (error) {
    console.error('Error getting steps:', error);
    return [];
  }
};

export const getStepsByDate = async (date: string): Promise<DailySteps | null> => {
  try {
    const db = await getDatabase();
    const row = await db.getFirstAsync<{
      id: string;
      user_id: string;
      date: string;
      steps: number;
      step_goal: number;
      source: string;
    }>(
      'SELECT * FROM daily_steps WHERE date = ?',
      [date]
    );

    if (!row) return null;

    return {
      id: row.id,
      userId: row.user_id,
      date: row.date,
      steps: row.steps,
      stepGoal: row.step_goal,
      source: row.source as 'manual' | 'apple_health' | 'google_fit',
    };
  } catch (error) {
    console.error('Error getting steps by date:', error);
    return null;
  }
};

export const saveSteps = async (steps: DailySteps): Promise<void> => {
  try {
    const db = await getDatabase();
    await db.runAsync(
      `INSERT OR REPLACE INTO daily_steps (id, user_id, date, steps, step_goal, source)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [steps.id, steps.userId, steps.date, steps.steps, steps.stepGoal, steps.source]
    );
  } catch (error) {
    console.error('Error saving steps:', error);
  }
};

export const getStepsInRange = async (startDate: string, endDate: string): Promise<DailySteps[]> => {
  try {
    const db = await getDatabase();
    const rows = await db.getAllAsync<{
      id: string;
      user_id: string;
      date: string;
      steps: number;
      step_goal: number;
      source: string;
    }>(
      'SELECT * FROM daily_steps WHERE date BETWEEN ? AND ? ORDER BY date',
      [startDate, endDate]
    );

    return rows.map(r => ({
      id: r.id,
      userId: r.user_id,
      date: r.date,
      steps: r.steps,
      stepGoal: r.step_goal,
      source: r.source as 'manual' | 'apple_health' | 'google_fit',
    }));
  } catch (error) {
    console.error('Error getting steps in range:', error);
    return [];
  }
};

// ============ BODY WEIGHT ============

export const getWeights = async (): Promise<DailyWeight[]> => {
  try {
    const db = await getDatabase();
    const rows = await db.getAllAsync<{
      id: string;
      user_id: string;
      date: string;
      weight: number;
      unit: string;
      source: string;
      created: string;
    }>('SELECT * FROM daily_weights ORDER BY date DESC');

    return rows.map(r => ({
      id: r.id,
      userId: r.user_id,
      date: r.date,
      weight: r.weight,
      unit: r.unit as 'kg' | 'lbs',
      source: r.source as 'manual' | 'smart_scale',
      created: r.created,
    }));
  } catch (error) {
    console.error('Error getting weights:', error);
    return [];
  }
};

export const getWeightByDate = async (date: string): Promise<DailyWeight | null> => {
  try {
    const db = await getDatabase();
    const row = await db.getFirstAsync<{
      id: string;
      user_id: string;
      date: string;
      weight: number;
      unit: string;
      source: string;
      created: string;
    }>(
      'SELECT * FROM daily_weights WHERE date = ?',
      [date]
    );

    if (!row) return null;

    return {
      id: row.id,
      userId: row.user_id,
      date: row.date,
      weight: row.weight,
      unit: row.unit as 'kg' | 'lbs',
      source: row.source as 'manual' | 'smart_scale',
      created: row.created,
    };
  } catch (error) {
    console.error('Error getting weight by date:', error);
    return null;
  }
};

export const saveWeight = async (weight: DailyWeight): Promise<void> => {
  try {
    const db = await getDatabase();
    await db.runAsync(
      `INSERT OR REPLACE INTO daily_weights (id, user_id, date, weight, unit, source, created)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [weight.id, weight.userId, weight.date, weight.weight, weight.unit, weight.source, weight.created]
    );
  } catch (error) {
    console.error('Error saving weight:', error);
  }
};

export const deleteWeight = async (weightId: string): Promise<void> => {
  try {
    const db = await getDatabase();
    await db.runAsync('DELETE FROM daily_weights WHERE id = ?', [weightId]);
  } catch (error) {
    console.error('Error deleting weight:', error);
  }
};

export const getWeightsInRange = async (startDate: string, endDate: string): Promise<DailyWeight[]> => {
  try {
    const db = await getDatabase();
    const rows = await db.getAllAsync<{
      id: string;
      user_id: string;
      date: string;
      weight: number;
      unit: string;
      source: string;
      created: string;
    }>(
      'SELECT * FROM daily_weights WHERE date BETWEEN ? AND ? ORDER BY date ASC',
      [startDate, endDate]
    );

    return rows.map(r => ({
      id: r.id,
      userId: r.user_id,
      date: r.date,
      weight: r.weight,
      unit: r.unit as 'kg' | 'lbs',
      source: r.source as 'manual' | 'smart_scale',
      created: r.created,
    }));
  } catch (error) {
    console.error('Error getting weights in range:', error);
    return [];
  }
};

// ============ WORKOUT TEMPLATES ============

const loadTemplateExercises = async (templateId: string): Promise<ExerciseTemplate[]> => {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{
    id: string;
    exercise_name: string;
    target_sets: number;
    target_reps: number;
    target_weight: number | null;
    order_index: number;
  }>(
    'SELECT * FROM exercise_templates WHERE template_id = ? ORDER BY order_index',
    [templateId]
  );

  return rows.map(r => ({
    id: r.id,
    exerciseName: r.exercise_name,
    targetSets: r.target_sets,
    targetReps: r.target_reps,
    targetWeight: r.target_weight || undefined,
    order: r.order_index,
  }));
};

export const getTemplates = async (): Promise<WorkoutTemplate[]> => {
  try {
    const db = await getDatabase();
    const rows = await db.getAllAsync<{
      id: string;
      user_id: string;
      name: string;
      created: string;
    }>('SELECT * FROM workout_templates ORDER BY created DESC');

    const results: WorkoutTemplate[] = [];
    for (const row of rows) {
      const exercises = await loadTemplateExercises(row.id);
      results.push({
        id: row.id,
        userId: row.user_id,
        name: row.name,
        created: row.created,
        exercises,
      });
    }
    return results;
  } catch (error) {
    console.error('Error getting templates:', error);
    return [];
  }
};

export const saveTemplate = async (template: WorkoutTemplate): Promise<void> => {
  try {
    const db = await getDatabase();

    await db.withTransactionAsync(async () => {
      await db.runAsync(
        `INSERT OR REPLACE INTO workout_templates (id, user_id, name, created)
         VALUES (?, ?, ?, ?)`,
        [template.id, template.userId, template.name, template.created]
      );

      // Delete existing exercises
      await db.runAsync('DELETE FROM exercise_templates WHERE template_id = ?', [template.id]);

      // Insert exercises
      for (const ex of template.exercises) {
        await db.runAsync(
          `INSERT INTO exercise_templates (id, template_id, exercise_name, target_sets, target_reps, target_weight, order_index)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [ex.id, template.id, ex.exerciseName, ex.targetSets, ex.targetReps, ex.targetWeight || null, ex.order]
        );
      }
    });
  } catch (error) {
    console.error('Error saving template:', error);
  }
};

export const deleteTemplate = async (templateId: string): Promise<void> => {
  try {
    const db = await getDatabase();
    await db.runAsync('DELETE FROM workout_templates WHERE id = ?', [templateId]);
  } catch (error) {
    console.error('Error deleting template:', error);
  }
};

export const getTemplateById = async (templateId: string): Promise<WorkoutTemplate | null> => {
  try {
    const db = await getDatabase();
    const row = await db.getFirstAsync<{
      id: string;
      user_id: string;
      name: string;
      created: string;
    }>(
      'SELECT * FROM workout_templates WHERE id = ?',
      [templateId]
    );

    if (!row) return null;

    const exercises = await loadTemplateExercises(row.id);
    return {
      id: row.id,
      userId: row.user_id,
      name: row.name,
      created: row.created,
      exercises,
    };
  } catch (error) {
    console.error('Error getting template by id:', error);
    return null;
  }
};

// ============ PERSONAL RECORDS ============

export const getPersonalRecords = async (): Promise<PersonalRecord[]> => {
  try {
    const db = await getDatabase();
    const rows = await db.getAllAsync<{
      id: string;
      user_id: string;
      exercise_name: string;
      weight: number;
      reps: number;
      date: string;
      workout_id: string | null;
      created: string;
    }>('SELECT * FROM personal_records ORDER BY weight DESC');

    return rows.map(r => ({
      id: r.id,
      userId: r.user_id,
      exerciseName: r.exercise_name,
      weight: r.weight,
      reps: r.reps,
      date: r.date,
      workoutId: r.workout_id || '',
      created: r.created,
    }));
  } catch (error) {
    console.error('Error getting personal records:', error);
    return [];
  }
};

export const savePersonalRecord = async (pr: PersonalRecord): Promise<void> => {
  try {
    const db = await getDatabase();
    await db.runAsync(
      `INSERT OR REPLACE INTO personal_records (id, user_id, exercise_name, weight, reps, date, workout_id, created)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [pr.id, pr.userId, pr.exerciseName, pr.weight, pr.reps, pr.date, pr.workoutId || null, pr.created]
    );
  } catch (error) {
    console.error('Error saving personal record:', error);
  }
};

export const deletePersonalRecord = async (prId: string): Promise<void> => {
  try {
    const db = await getDatabase();
    await db.runAsync('DELETE FROM personal_records WHERE id = ?', [prId]);
  } catch (error) {
    console.error('Error deleting personal record:', error);
  }
};

export const getPersonalRecordByExercise = async (exerciseName: string): Promise<PersonalRecord | null> => {
  try {
    const db = await getDatabase();
    const row = await db.getFirstAsync<{
      id: string;
      user_id: string;
      exercise_name: string;
      weight: number;
      reps: number;
      date: string;
      workout_id: string | null;
      created: string;
    }>(
      'SELECT * FROM personal_records WHERE LOWER(exercise_name) = LOWER(?)',
      [exerciseName]
    );

    if (!row) return null;

    return {
      id: row.id,
      userId: row.user_id,
      exerciseName: row.exercise_name,
      weight: row.weight,
      reps: row.reps,
      date: row.date,
      workoutId: row.workout_id || '',
      created: row.created,
    };
  } catch (error) {
    console.error('Error getting PR by exercise:', error);
    return null;
  }
};

export const checkAndUpdatePRs = async (workout: WorkoutLog): Promise<PersonalRecord[]> => {
  const newPRs: PersonalRecord[] = [];
  const existingPRs = await getPersonalRecords();

  for (const exercise of workout.exercises) {
    let bestSet = exercise.sets[0];
    for (const set of exercise.sets) {
      if (set.weight > bestSet.weight ||
          (set.weight === bestSet.weight && set.reps > bestSet.reps)) {
        bestSet = set;
      }
    }

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
    const db = await getDatabase();

    // Use SQL to find the most recent workout with this exercise
    const query = excludeWorkoutId
      ? `SELECT w.id, w.date, w.name as workout_name
         FROM workout_logs w
         JOIN exercise_logs e ON e.workout_id = w.id
         WHERE w.user_id = ? AND LOWER(e.exercise_name) = LOWER(?) AND w.id != ?
         ORDER BY w.date DESC
         LIMIT 1`
      : `SELECT w.id, w.date, w.name as workout_name
         FROM workout_logs w
         JOIN exercise_logs e ON e.workout_id = w.id
         WHERE w.user_id = ? AND LOWER(e.exercise_name) = LOWER(?)
         ORDER BY w.date DESC
         LIMIT 1`;

    const params = excludeWorkoutId
      ? [userId, exerciseName, excludeWorkoutId]
      : [userId, exerciseName];

    const workoutRow = await db.getFirstAsync<{
      id: string;
      date: string;
      workout_name: string;
    }>(query, params);

    if (!workoutRow) return null;

    // Get the exercise and its sets
    const exerciseRow = await db.getFirstAsync<{ id: string }>(
      'SELECT id FROM exercise_logs WHERE workout_id = ? AND LOWER(exercise_name) = LOWER(?)',
      [workoutRow.id, exerciseName]
    );

    if (!exerciseRow) return null;

    const setRows = await db.getAllAsync<{ reps: number; weight: number }>(
      'SELECT reps, weight FROM set_logs WHERE exercise_log_id = ? ORDER BY order_index LIMIT 1',
      [exerciseRow.id]
    );

    const setCount = await db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM set_logs WHERE exercise_log_id = ?',
      [exerciseRow.id]
    );

    if (setRows.length === 0) return null;

    return {
      date: workoutRow.date,
      sets: setCount?.count || 0,
      reps: setRows[0].reps,
      weight: setRows[0].weight,
      workoutName: workoutRow.workout_name,
    };
  } catch (error) {
    console.error('Error getting last exercise performance:', error);
    return null;
  }
};

// ============ CUSTOM EXERCISES ============

export const getCustomExercises = async (): Promise<Exercise[]> => {
  try {
    const db = await getDatabase();
    const rows = await db.getAllAsync<{
      id: string;
      name: string;
      category: string;
      default_sets: number | null;
      default_reps: number | null;
    }>('SELECT * FROM custom_exercises ORDER BY name');

    return rows.map(r => ({
      id: r.id,
      name: r.name,
      category: r.category as MuscleGroup,
      defaultSets: r.default_sets || undefined,
      defaultReps: r.default_reps || undefined,
    }));
  } catch (error) {
    console.error('Error getting custom exercises:', error);
    return [];
  }
};

export const saveCustomExercise = async (exercise: Exercise): Promise<void> => {
  try {
    const db = await getDatabase();
    await db.runAsync(
      `INSERT OR REPLACE INTO custom_exercises (id, name, category, default_sets, default_reps)
       VALUES (?, ?, ?, ?, ?)`,
      [exercise.id, exercise.name, exercise.category, exercise.defaultSets || null, exercise.defaultReps || null]
    );
  } catch (error) {
    console.error('Error saving custom exercise:', error);
  }
};

export const updateCustomExercise = async (exercise: Exercise): Promise<void> => {
  await saveCustomExercise(exercise);
};

export const deleteCustomExercise = async (exerciseId: string): Promise<void> => {
  try {
    const db = await getDatabase();
    await db.runAsync('DELETE FROM custom_exercises WHERE id = ?', [exerciseId]);
  } catch (error) {
    console.error('Error deleting custom exercise:', error);
  }
};

export const getCustomExerciseById = async (id: string): Promise<Exercise | null> => {
  try {
    const db = await getDatabase();
    const row = await db.getFirstAsync<{
      id: string;
      name: string;
      category: string;
      default_sets: number | null;
      default_reps: number | null;
    }>(
      'SELECT * FROM custom_exercises WHERE id = ?',
      [id]
    );

    if (!row) return null;

    return {
      id: row.id,
      name: row.name,
      category: row.category as MuscleGroup,
      defaultSets: row.default_sets || undefined,
      defaultReps: row.default_reps || undefined,
    };
  } catch (error) {
    console.error('Error getting custom exercise by id:', error);
    return null;
  }
};

// ============ WEEKLY STATS ============

export const calculateWeeklyStats = async (
  weekStart: string,
  weekEnd: string,
  user: User
): Promise<WeeklyStats> => {
  const workouts = await getWorkoutsInRange(weekStart, weekEnd);
  const nutrition = await getNutritionInRange(weekStart, weekEnd);
  const steps = await getStepsInRange(weekStart, weekEnd);

  const totalWorkouts = workouts.filter(w => w.completed).length;
  const uniqueWorkoutDates = new Set(workouts.map(w => w.date));
  const daysActive = uniqueWorkoutDates.size;

  const totalCalories = nutrition.reduce((sum, n) => {
    const dailyTotal = n.meals.reduce((mealSum, meal) => mealSum + meal.calories, 0);
    return sum + dailyTotal;
  }, 0);
  const avgCalories = nutrition.length > 0 ? Math.round(totalCalories / nutrition.length) : 0;
  const calorieTarget = user.dailyCalorieTarget * 7;

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

// ============ ACHIEVEMENTS ============

export const getAchievements = async (): Promise<Achievement[]> => {
  try {
    const db = await getDatabase();
    const rows = await db.getAllAsync<{
      id: string;
      title: string;
      description: string;
      icon: string;
      category: string;
      target_value: number;
      current_value: number;
      is_unlocked: number;
      unlocked_date: string | null;
    }>('SELECT * FROM achievements');

    return rows.map(r => ({
      id: r.id,
      title: r.title,
      description: r.description,
      icon: r.icon,
      category: r.category as Achievement['category'],
      targetValue: r.target_value,
      currentValue: r.current_value,
      isUnlocked: r.is_unlocked === 1,
      unlockedDate: r.unlocked_date || undefined,
    }));
  } catch (error) {
    console.error('Error getting achievements:', error);
    return [];
  }
};

export const saveAchievements = async (achievements: Achievement[]): Promise<void> => {
  try {
    const db = await getDatabase();

    await db.withTransactionAsync(async () => {
      for (const a of achievements) {
        await db.runAsync(
          `INSERT OR REPLACE INTO achievements (id, title, description, icon, category, target_value, current_value, is_unlocked, unlocked_date)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [a.id, a.title, a.description, a.icon, a.category, a.targetValue, a.currentValue, a.isUnlocked ? 1 : 0, a.unlockedDate || null]
        );
      }
    });
  } catch (error) {
    console.error('Error saving achievements:', error);
  }
};

export const initializeAchievements = async (): Promise<Achievement[]> => {
  const existing = await getAchievements();
  if (existing.length > 0) {
    return existing;
  }

  const achievements: Achievement[] = achievementDefinitions.map(def => ({
    ...def,
    currentValue: 0,
    isUnlocked: false,
  }));

  await saveAchievements(achievements);
  return achievements;
};

export const checkAndUpdateAchievements = async (): Promise<Achievement[]> => {
  const achievements = await initializeAchievements();
  const newlyUnlocked: Achievement[] = [];

  const workouts = await getWorkouts();
  const prs = await getPersonalRecords();
  const steps = await getSteps();
  const nutrition = await getNutrition();

  const totalWorkouts = workouts.filter(w => w.completed).length;
  const streak = calculateWorkoutStreak(workouts);
  const totalPRs = prs.length;

  const daysStepGoalMet = steps.filter(s => s.steps >= s.stepGoal).length;
  const daysNutritionLogged = nutrition.filter(n => n.meals.length > 0).length;

  const { start: weekStart, end: weekEnd } = getWeekDates(new Date());
  const weekWorkouts = workouts.filter(w => isDateInRange(w.date, weekStart, weekEnd));
  const muscleGroupsTrained = new Set<MuscleGroup>();

  const { EXERCISE_DATABASE } = await import('../data/exercises');
  const customExercises = await getCustomExercises();
  const allExercises = [...EXERCISE_DATABASE, ...customExercises];

  weekWorkouts.forEach(workout => {
    workout.exercises.forEach(ex => {
      const exerciseInfo = allExercises.find(
        e => e.name.toLowerCase() === ex.exerciseName.toLowerCase()
      );
      if (exerciseInfo) {
        muscleGroupsTrained.add(exerciseInfo.category);
      }
    });
  });

  for (const achievement of achievements) {
    if (achievement.isUnlocked) continue;

    let newValue = 0;

    switch (achievement.id) {
      case 'first_workout':
      case 'dedicated_10':
      case 'warrior_50':
        newValue = totalWorkouts;
        break;
      case 'streak_7':
      case 'streak_30':
        newValue = streak.longest;
        break;
      case 'pr_5':
      case 'pr_25':
        newValue = totalPRs;
        break;
      case 'steps_7_days':
        newValue = daysStepGoalMet;
        break;
      case 'nutrition_7_days':
        newValue = daysNutritionLogged;
        break;
      case 'well_rounded':
        newValue = muscleGroupsTrained.size;
        break;
    }

    achievement.currentValue = newValue;

    if (newValue >= achievement.targetValue && !achievement.isUnlocked) {
      achievement.isUnlocked = true;
      achievement.unlockedDate = new Date().toISOString();
      newlyUnlocked.push(achievement);
    }
  }

  await saveAchievements(achievements);
  return newlyUnlocked;
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

// ============ CLEAR ALL DATA ============

export const clearAllData = async (): Promise<void> => {
  try {
    const { clearDatabase } = await import('./database');
    await clearDatabase();
  } catch (error) {
    console.error('Error clearing data:', error);
  }
};
