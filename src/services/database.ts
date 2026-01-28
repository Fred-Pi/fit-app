/**
 * SQLite Database Service
 *
 * Handles database initialization, schema management, and migration from AsyncStorage.
 * Uses expo-sqlite for persistent local storage with proper relational structure.
 * Falls back to AsyncStorage on web platform where SQLite is not supported.
 */

import { Platform } from 'react-native';
import * as SQLite from 'expo-sqlite';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  User,
  WorkoutLog,
  DailyNutrition,
  DailySteps,
  DailyWeight,
  WorkoutTemplate,
  PersonalRecord,
  Exercise,
  Achievement,
} from '../types';

const DATABASE_NAME = 'fitapp.db';
const SCHEMA_VERSION = 1;

// Check if we're on a platform that supports SQLite
const isNativePlatform = Platform.OS !== 'web';

// Singleton database instance
let dbInstance: SQLite.SQLiteDatabase | null = null;

/**
 * Get or create database connection
 * Returns null on web platform (shim returns null)
 */
export const getDatabase = async (): Promise<SQLite.SQLiteDatabase | null> => {
  if (!isNativePlatform) {
    return null;
  }
  if (!dbInstance) {
    const db = await SQLite.openDatabaseAsync(DATABASE_NAME);
    // The web shim returns null, so check before assigning
    if (db) {
      dbInstance = db;
    }
  }
  return dbInstance;
};

/**
 * Get database with non-null assertion (for internal use after platform check)
 */
const getNativeDatabase = async (): Promise<SQLite.SQLiteDatabase> => {
  const db = await getDatabase();
  return db!;
};

/**
 * Initialize database schema - creates all tables and indexes
 * On web, this is a no-op as we use AsyncStorage directly
 */
export const initializeDatabase = async (): Promise<void> => {
  if (!isNativePlatform) {
    return; // Web uses AsyncStorage directly via storage.ts
  }
  const db = await getNativeDatabase();

  // Enable WAL mode and foreign keys
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;
  `);

  // Create all tables
  await db.execAsync(`
    -- App metadata for tracking migrations
    CREATE TABLE IF NOT EXISTS app_meta (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    -- Core user table
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT,
      daily_calorie_target INTEGER DEFAULT 2200,
      daily_step_goal INTEGER DEFAULT 10000,
      preferred_weight_unit TEXT DEFAULT 'lbs' CHECK(preferred_weight_unit IN ('kg', 'lbs')),
      goal_weight REAL,
      created TEXT NOT NULL
    );

    -- Workout logs (parent)
    CREATE TABLE IF NOT EXISTS workout_logs (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      date TEXT NOT NULL,
      name TEXT NOT NULL,
      duration REAL,
      notes TEXT,
      completed INTEGER DEFAULT 0,
      created TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    -- Exercise logs (child of workout_logs)
    CREATE TABLE IF NOT EXISTS exercise_logs (
      id TEXT PRIMARY KEY,
      workout_id TEXT NOT NULL,
      exercise_name TEXT NOT NULL,
      notes TEXT,
      order_index INTEGER NOT NULL,
      FOREIGN KEY (workout_id) REFERENCES workout_logs(id) ON DELETE CASCADE
    );

    -- Set logs (child of exercise_logs)
    CREATE TABLE IF NOT EXISTS set_logs (
      id TEXT PRIMARY KEY,
      exercise_log_id TEXT NOT NULL,
      reps INTEGER NOT NULL,
      weight REAL NOT NULL,
      rpe REAL,
      completed INTEGER DEFAULT 0,
      order_index INTEGER NOT NULL,
      FOREIGN KEY (exercise_log_id) REFERENCES exercise_logs(id) ON DELETE CASCADE
    );

    -- Daily nutrition (parent)
    CREATE TABLE IF NOT EXISTS daily_nutrition (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      date TEXT NOT NULL,
      calorie_target INTEGER NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id),
      UNIQUE(user_id, date)
    );

    -- Meals (child of daily_nutrition)
    CREATE TABLE IF NOT EXISTS meals (
      id TEXT PRIMARY KEY,
      nutrition_id TEXT NOT NULL,
      name TEXT NOT NULL,
      calories INTEGER NOT NULL,
      protein REAL NOT NULL,
      carbs REAL NOT NULL,
      fats REAL NOT NULL,
      time TEXT NOT NULL,
      FOREIGN KEY (nutrition_id) REFERENCES daily_nutrition(id) ON DELETE CASCADE
    );

    -- Daily steps
    CREATE TABLE IF NOT EXISTS daily_steps (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      date TEXT NOT NULL,
      steps INTEGER DEFAULT 0,
      step_goal INTEGER NOT NULL,
      source TEXT DEFAULT 'manual',
      FOREIGN KEY (user_id) REFERENCES users(id),
      UNIQUE(user_id, date)
    );

    -- Daily weights
    CREATE TABLE IF NOT EXISTS daily_weights (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      date TEXT NOT NULL,
      weight REAL NOT NULL,
      unit TEXT NOT NULL,
      source TEXT DEFAULT 'manual',
      created TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id),
      UNIQUE(user_id, date)
    );

    -- Personal records
    CREATE TABLE IF NOT EXISTS personal_records (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      exercise_name TEXT NOT NULL,
      weight REAL NOT NULL,
      reps INTEGER NOT NULL,
      date TEXT NOT NULL,
      workout_id TEXT,
      created TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (workout_id) REFERENCES workout_logs(id),
      UNIQUE(user_id, exercise_name)
    );

    -- Workout templates (parent)
    CREATE TABLE IF NOT EXISTS workout_templates (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      created TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    -- Exercise templates (child of workout_templates)
    CREATE TABLE IF NOT EXISTS exercise_templates (
      id TEXT PRIMARY KEY,
      template_id TEXT NOT NULL,
      exercise_name TEXT NOT NULL,
      target_sets INTEGER NOT NULL,
      target_reps INTEGER NOT NULL,
      target_weight REAL,
      order_index INTEGER NOT NULL,
      FOREIGN KEY (template_id) REFERENCES workout_templates(id) ON DELETE CASCADE
    );

    -- Custom exercises
    CREATE TABLE IF NOT EXISTS custom_exercises (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      default_sets INTEGER,
      default_reps INTEGER,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    -- Achievements
    CREATE TABLE IF NOT EXISTS achievements (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      icon TEXT NOT NULL,
      category TEXT NOT NULL,
      target_value INTEGER NOT NULL,
      current_value INTEGER DEFAULT 0,
      is_unlocked INTEGER DEFAULT 0,
      unlocked_date TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
  `);

  // Create indexes for performance
  await db.execAsync(`
    -- Date-based lookups (most critical)
    CREATE INDEX IF NOT EXISTS idx_workout_logs_user_date ON workout_logs(user_id, date);
    CREATE INDEX IF NOT EXISTS idx_daily_nutrition_user_date ON daily_nutrition(user_id, date);
    CREATE INDEX IF NOT EXISTS idx_daily_steps_user_date ON daily_steps(user_id, date);
    CREATE INDEX IF NOT EXISTS idx_daily_weights_user_date ON daily_weights(user_id, date);

    -- Date range queries for analytics
    CREATE INDEX IF NOT EXISTS idx_workout_logs_date ON workout_logs(date);
    CREATE INDEX IF NOT EXISTS idx_daily_weights_date ON daily_weights(date);

    -- PR lookups
    CREATE INDEX IF NOT EXISTS idx_personal_records_exercise ON personal_records(user_id, exercise_name);

    -- Nested data lookups
    CREATE INDEX IF NOT EXISTS idx_exercise_logs_workout ON exercise_logs(workout_id);
    CREATE INDEX IF NOT EXISTS idx_set_logs_exercise ON set_logs(exercise_log_id);
    CREATE INDEX IF NOT EXISTS idx_meals_nutrition ON meals(nutrition_id);
    CREATE INDEX IF NOT EXISTS idx_exercise_templates_template ON exercise_templates(template_id);
  `);
};

/**
 * Check if migration from AsyncStorage has been completed
 */
export const isMigrationComplete = async (): Promise<boolean> => {
  if (!isNativePlatform) {
    return true; // Web doesn't need migration
  }
  const db = await getNativeDatabase();
  const result = await db.getFirstAsync<{ value: string }>(
    'SELECT value FROM app_meta WHERE key = ?',
    ['asyncstorage_migrated']
  );
  return result?.value === 'true';
};

/**
 * Mark migration as complete
 */
const markMigrationComplete = async (): Promise<void> => {
  const db = await getNativeDatabase();
  await db.runAsync(
    'INSERT OR REPLACE INTO app_meta (key, value) VALUES (?, ?)',
    ['asyncstorage_migrated', 'true']
  );
};

/**
 * Generate unique ID (same as original storage.ts)
 */
const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

/**
 * Migrate all data from AsyncStorage to SQLite
 */
export const migrateFromAsyncStorage = async (): Promise<void> => {
  if (!isNativePlatform) {
    return; // Web doesn't need migration
  }

  // Skip if already migrated
  if (await isMigrationComplete()) {
    return;
  }

  const db = await getNativeDatabase();

  try {
    // Migrate User
    const userJson = await AsyncStorage.getItem('@fit_app_user');
    if (userJson) {
      const user: User = JSON.parse(userJson);
      await db.runAsync(
        `INSERT OR REPLACE INTO users (id, name, email, daily_calorie_target, daily_step_goal, preferred_weight_unit, goal_weight, created)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [user.id, user.name, user.email || null, user.dailyCalorieTarget, user.dailyStepGoal, user.preferredWeightUnit, user.goalWeight || null, user.created]
      );
    }

    // Migrate Workouts (with nested exercises and sets)
    const workoutsJson = await AsyncStorage.getItem('@fit_app_workouts');
    if (workoutsJson) {
      const workouts: WorkoutLog[] = JSON.parse(workoutsJson);
      for (const workout of workouts) {
        await db.runAsync(
          `INSERT OR REPLACE INTO workout_logs (id, user_id, date, name, duration, notes, completed, created)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [workout.id, workout.userId, workout.date, workout.name, workout.duration || null, workout.notes || null, workout.completed ? 1 : 0, workout.created]
        );

        // Migrate exercises
        for (let i = 0; i < workout.exercises.length; i++) {
          const exercise = workout.exercises[i];
          await db.runAsync(
            `INSERT OR REPLACE INTO exercise_logs (id, workout_id, exercise_name, notes, order_index)
             VALUES (?, ?, ?, ?, ?)`,
            [exercise.id, workout.id, exercise.exerciseName, exercise.notes || null, i]
          );

          // Migrate sets
          for (let j = 0; j < exercise.sets.length; j++) {
            const set = exercise.sets[j];
            await db.runAsync(
              `INSERT INTO set_logs (id, exercise_log_id, reps, weight, rpe, completed, order_index)
               VALUES (?, ?, ?, ?, ?, ?, ?)`,
              [generateId(), exercise.id, set.reps, set.weight, set.rpe || null, set.completed ? 1 : 0, j]
            );
          }
        }
      }
    }

    // Migrate Nutrition (with nested meals)
    const nutritionJson = await AsyncStorage.getItem('@fit_app_nutrition');
    if (nutritionJson) {
      const nutritionRecords: DailyNutrition[] = JSON.parse(nutritionJson);
      for (const nutrition of nutritionRecords) {
        await db.runAsync(
          `INSERT OR REPLACE INTO daily_nutrition (id, user_id, date, calorie_target)
           VALUES (?, ?, ?, ?)`,
          [nutrition.id, nutrition.userId, nutrition.date, nutrition.calorieTarget]
        );

        // Migrate meals
        for (const meal of nutrition.meals) {
          await db.runAsync(
            `INSERT OR REPLACE INTO meals (id, nutrition_id, name, calories, protein, carbs, fats, time)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [meal.id, nutrition.id, meal.name, meal.calories, meal.protein, meal.carbs, meal.fats, meal.time]
          );
        }
      }
    }

    // Migrate Steps
    const stepsJson = await AsyncStorage.getItem('@fit_app_steps');
    if (stepsJson) {
      const stepsRecords: DailySteps[] = JSON.parse(stepsJson);
      for (const steps of stepsRecords) {
        await db.runAsync(
          `INSERT OR REPLACE INTO daily_steps (id, user_id, date, steps, step_goal, source)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [steps.id, steps.userId, steps.date, steps.steps, steps.stepGoal, steps.source]
        );
      }
    }

    // Migrate Weights
    const weightsJson = await AsyncStorage.getItem('@fit_app_weights');
    if (weightsJson) {
      const weights: DailyWeight[] = JSON.parse(weightsJson);
      for (const weight of weights) {
        await db.runAsync(
          `INSERT OR REPLACE INTO daily_weights (id, user_id, date, weight, unit, source, created)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [weight.id, weight.userId, weight.date, weight.weight, weight.unit, weight.source, weight.created]
        );
      }
    }

    // Migrate Templates (with nested exercise templates)
    const templatesJson = await AsyncStorage.getItem('@fit_app_templates');
    if (templatesJson) {
      const templates: WorkoutTemplate[] = JSON.parse(templatesJson);
      for (const template of templates) {
        await db.runAsync(
          `INSERT OR REPLACE INTO workout_templates (id, user_id, name, created)
           VALUES (?, ?, ?, ?)`,
          [template.id, template.userId, template.name, template.created]
        );

        // Migrate exercise templates
        for (let i = 0; i < template.exercises.length; i++) {
          const ex = template.exercises[i];
          await db.runAsync(
            `INSERT OR REPLACE INTO exercise_templates (id, template_id, exercise_name, target_sets, target_reps, target_weight, order_index)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [ex.id, template.id, ex.exerciseName, ex.targetSets, ex.targetReps, ex.targetWeight || null, ex.order]
          );
        }
      }
    }

    // Migrate Personal Records
    const prsJson = await AsyncStorage.getItem('@fit_app_personal_records');
    if (prsJson) {
      const prs: PersonalRecord[] = JSON.parse(prsJson);
      for (const pr of prs) {
        await db.runAsync(
          `INSERT OR REPLACE INTO personal_records (id, user_id, exercise_name, weight, reps, date, workout_id, created)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [pr.id, pr.userId, pr.exerciseName, pr.weight, pr.reps, pr.date, pr.workoutId, pr.created]
        );
      }
    }

    // Migrate Custom Exercises
    const customExJson = await AsyncStorage.getItem('@fit_app_custom_exercises');
    if (customExJson) {
      const customExercises: Exercise[] = JSON.parse(customExJson);
      for (const ex of customExercises) {
        await db.runAsync(
          `INSERT OR REPLACE INTO custom_exercises (id, name, category, default_sets, default_reps)
           VALUES (?, ?, ?, ?, ?)`,
          [ex.id, ex.name, ex.category, ex.defaultSets || null, ex.defaultReps || null]
        );
      }
    }

    // Migrate Achievements
    const achievementsJson = await AsyncStorage.getItem('@fit_app_achievements');
    if (achievementsJson) {
      const achievements: Achievement[] = JSON.parse(achievementsJson);
      for (const achievement of achievements) {
        await db.runAsync(
          `INSERT OR REPLACE INTO achievements (id, title, description, icon, category, target_value, current_value, is_unlocked, unlocked_date)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [achievement.id, achievement.title, achievement.description, achievement.icon, achievement.category, achievement.targetValue, achievement.currentValue, achievement.isUnlocked ? 1 : 0, achievement.unlockedDate || null]
        );
      }
    }

    // Mark migration as complete
    await markMigrationComplete();

    console.log('Migration from AsyncStorage to SQLite completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
};

/**
 * Clear all data from SQLite database (for testing/reset)
 */
export const clearDatabase = async (): Promise<void> => {
  if (!isNativePlatform) {
    return; // Web uses AsyncStorage.clear() directly
  }
  const db = await getNativeDatabase();

  await db.execAsync(`
    DELETE FROM set_logs;
    DELETE FROM exercise_logs;
    DELETE FROM workout_logs;
    DELETE FROM meals;
    DELETE FROM daily_nutrition;
    DELETE FROM daily_steps;
    DELETE FROM daily_weights;
    DELETE FROM exercise_templates;
    DELETE FROM workout_templates;
    DELETE FROM personal_records;
    DELETE FROM custom_exercises;
    DELETE FROM achievements;
    DELETE FROM users;
    DELETE FROM app_meta;
  `);
};

/**
 * Get schema version for future migrations
 */
export const getSchemaVersion = async (): Promise<number> => {
  if (!isNativePlatform) {
    return SCHEMA_VERSION; // Web doesn't track schema version
  }
  const db = await getNativeDatabase();
  const result = await db.getFirstAsync<{ value: string }>(
    'SELECT value FROM app_meta WHERE key = ?',
    ['schema_version']
  );
  return result ? parseInt(result.value, 10) : 0;
};

/**
 * Set schema version
 */
export const setSchemaVersion = async (version: number): Promise<void> => {
  if (!isNativePlatform) {
    return; // Web doesn't track schema version
  }
  const db = await getNativeDatabase();
  await db.runAsync(
    'INSERT OR REPLACE INTO app_meta (key, value) VALUES (?, ?)',
    ['schema_version', version.toString()]
  );
};
