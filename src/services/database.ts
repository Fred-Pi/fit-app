/**
 * SQLite Database Service
 *
 * Handles database initialization, schema management, and migration from AsyncStorage.
 * Uses expo-sqlite for persistent local storage with proper relational structure.
 * Uses IndexedDB via Dexie on web platform for browser-based storage.
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
import { getIndexedDBWrapper, initializeIndexedDB, IndexedDBWrapper } from './database/indexeddb';
import { logInfo, logError } from '../utils/logger';

const DATABASE_NAME = 'fitapp.db';
const SCHEMA_VERSION = 3;

// Check if we're on a platform that supports SQLite
const isNativePlatform = Platform.OS !== 'web';

// Singleton database instance
let dbInstance: SQLite.SQLiteDatabase | null = null;

// Type for database that works on both platforms
export type DatabaseInstance = SQLite.SQLiteDatabase | IndexedDBWrapper;

/**
 * Get or create database connection
 * Returns SQLite on native platforms, IndexedDB wrapper on web
 */
export const getDatabase = async (): Promise<DatabaseInstance | null> => {
  if (!isNativePlatform) {
    // Web platform - use IndexedDB via Dexie
    await initializeIndexedDB();
    return getIndexedDBWrapper();
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
 * Only use this after confirming we're on native platform
 */
const getNativeDatabase = async (): Promise<SQLite.SQLiteDatabase> => {
  if (!dbInstance) {
    const db = await SQLite.openDatabaseAsync(DATABASE_NAME);
    if (db) {
      dbInstance = db;
    }
  }
  return dbInstance!;
};

/**
 * Initialize database schema - creates all tables and indexes
 * On web, initializes IndexedDB via Dexie
 */
export const initializeDatabase = async (): Promise<void> => {
  if (!isNativePlatform) {
    // Web uses IndexedDB via Dexie
    await initializeIndexedDB();
    return;
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
      age INTEGER,
      height REAL,
      height_unit TEXT DEFAULT 'cm' CHECK(height_unit IN ('cm', 'ft')),
      weight REAL,
      bmi REAL,
      daily_calorie_target INTEGER DEFAULT 2200,
      daily_step_goal INTEGER DEFAULT 10000,
      preferred_weight_unit TEXT DEFAULT 'lbs' CHECK(preferred_weight_unit IN ('kg', 'lbs')),
      goal_weight REAL,
      onboarding_completed TEXT,
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
      preset_id TEXT,
      serving_multiplier REAL DEFAULT 1.0,
      FOREIGN KEY (nutrition_id) REFERENCES daily_nutrition(id) ON DELETE CASCADE,
      FOREIGN KEY (preset_id) REFERENCES food_presets(id) ON DELETE SET NULL
    );

    -- Food presets (reusable food items)
    CREATE TABLE IF NOT EXISTS food_presets (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      serving_size REAL NOT NULL,
      serving_unit TEXT NOT NULL CHECK(serving_unit IN ('g', 'ml', 'piece')),
      calories REAL NOT NULL,
      protein REAL NOT NULL,
      carbs REAL NOT NULL,
      fats REAL NOT NULL,
      created_at TEXT NOT NULL,
      last_used_at TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id)
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

    -- Sync queue for offline changes
    CREATE TABLE IF NOT EXISTS sync_queue (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      table_name TEXT NOT NULL,
      record_id TEXT NOT NULL,
      operation TEXT NOT NULL CHECK(operation IN ('UPSERT', 'DELETE')),
      payload TEXT,
      created_at TEXT NOT NULL,
      processed_at TEXT,
      error TEXT
    );

    -- Sync metadata for tracking last sync time per table
    CREATE TABLE IF NOT EXISTS sync_metadata (
      table_name TEXT PRIMARY KEY,
      last_sync_at TEXT
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

    -- Food preset lookups
    CREATE INDEX IF NOT EXISTS idx_food_presets_user ON food_presets(user_id);
    CREATE INDEX IF NOT EXISTS idx_food_presets_recent ON food_presets(user_id, last_used_at DESC);

    -- Sync queue indexes
    CREATE INDEX IF NOT EXISTS idx_sync_queue_pending ON sync_queue(processed_at) WHERE processed_at IS NULL;
    CREATE INDEX IF NOT EXISTS idx_sync_queue_table ON sync_queue(table_name, record_id);
  `);

  // Run schema migrations for existing databases
  await runSchemaMigrations(db);
};

/**
 * Run schema migrations for existing databases
 */
const runSchemaMigrations = async (db: SQLite.SQLiteDatabase): Promise<void> => {
  const currentVersion = await getSchemaVersion();

  // Migration to version 2: Add onboarding fields to users table
  if (currentVersion < 2) {
    try {
      // Check if columns exist before adding (SQLite doesn't support IF NOT EXISTS for ALTER TABLE)
      const tableInfo = await db.getAllAsync<{ name: string }>('PRAGMA table_info(users)');
      const existingColumns = tableInfo.map(col => col.name);

      if (!existingColumns.includes('age')) {
        await db.runAsync('ALTER TABLE users ADD COLUMN age INTEGER');
      }
      if (!existingColumns.includes('height')) {
        await db.runAsync('ALTER TABLE users ADD COLUMN height REAL');
      }
      if (!existingColumns.includes('height_unit')) {
        await db.runAsync("ALTER TABLE users ADD COLUMN height_unit TEXT DEFAULT 'cm'");
      }
      if (!existingColumns.includes('weight')) {
        await db.runAsync('ALTER TABLE users ADD COLUMN weight REAL');
      }
      if (!existingColumns.includes('bmi')) {
        await db.runAsync('ALTER TABLE users ADD COLUMN bmi REAL');
      }
      if (!existingColumns.includes('onboarding_completed')) {
        await db.runAsync('ALTER TABLE users ADD COLUMN onboarding_completed TEXT');
      }

      await setSchemaVersion(2);
      logInfo('Schema migrated to version 2');
    } catch (error) {
      logError('Schema migration to version 2 failed', error);
    }
  }

  // Migration to version 3: Add food_presets table and extend meals table
  if (currentVersion < 3) {
    try {
      // Create food_presets table if it doesn't exist
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS food_presets (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          name TEXT NOT NULL,
          serving_size REAL NOT NULL,
          serving_unit TEXT NOT NULL CHECK(serving_unit IN ('g', 'ml', 'piece')),
          calories REAL NOT NULL,
          protein REAL NOT NULL,
          carbs REAL NOT NULL,
          fats REAL NOT NULL,
          created_at TEXT NOT NULL,
          last_used_at TEXT,
          FOREIGN KEY (user_id) REFERENCES users(id)
        );

        CREATE INDEX IF NOT EXISTS idx_food_presets_user ON food_presets(user_id);
        CREATE INDEX IF NOT EXISTS idx_food_presets_recent ON food_presets(user_id, last_used_at DESC);
      `);

      // Add columns to meals table for preset linking
      const mealsTableInfo = await db.getAllAsync<{ name: string }>('PRAGMA table_info(meals)');
      const existingMealsColumns = mealsTableInfo.map(col => col.name);

      if (!existingMealsColumns.includes('preset_id')) {
        await db.runAsync('ALTER TABLE meals ADD COLUMN preset_id TEXT REFERENCES food_presets(id) ON DELETE SET NULL');
      }
      if (!existingMealsColumns.includes('serving_multiplier')) {
        await db.runAsync('ALTER TABLE meals ADD COLUMN serving_multiplier REAL DEFAULT 1.0');
      }

      await setSchemaVersion(3);
      logInfo('Schema migrated to version 3');
    } catch (error) {
      logError('Schema migration to version 3 failed', error);
    }
  }
};

/**
 * Check if migration from AsyncStorage has been completed
 */
export const isMigrationComplete = async (): Promise<boolean> => {
  const db = await getDatabase();
  if (!db) return true;
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

    logInfo('Migration from AsyncStorage to SQLite completed successfully');
  } catch (error) {
    logError('Migration failed', error);
    throw error;
  }
};

/**
 * Clear all data from database (for testing/reset)
 */
export const clearDatabase = async (): Promise<void> => {
  const db = await getDatabase();
  if (!db) return;

  // These DELETE statements work on both SQLite and IndexedDB wrapper
  await db.runAsync('DELETE FROM set_logs');
  await db.runAsync('DELETE FROM exercise_logs');
  await db.runAsync('DELETE FROM workout_logs');
  await db.runAsync('DELETE FROM meals');
  await db.runAsync('DELETE FROM daily_nutrition');
  await db.runAsync('DELETE FROM food_presets');
  await db.runAsync('DELETE FROM daily_steps');
  await db.runAsync('DELETE FROM daily_weights');
  await db.runAsync('DELETE FROM exercise_templates');
  await db.runAsync('DELETE FROM workout_templates');
  await db.runAsync('DELETE FROM personal_records');
  await db.runAsync('DELETE FROM custom_exercises');
  await db.runAsync('DELETE FROM achievements');
  await db.runAsync('DELETE FROM users');
  await db.runAsync('DELETE FROM app_meta');
};

/**
 * Get schema version for future migrations
 */
export const getSchemaVersion = async (): Promise<number> => {
  const db = await getDatabase();
  if (!db) return SCHEMA_VERSION;
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
  const db = await getDatabase();
  if (!db) return;
  await db.runAsync(
    'INSERT OR REPLACE INTO app_meta (key, value) VALUES (?, ?)',
    ['schema_version', version.toString()]
  );
};
