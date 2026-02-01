/**
 * IndexedDB Database Service for Web Platform
 *
 * Provides a SQLite-compatible API wrapper around Dexie.js to enable
 * the same storage modules to work on both native (SQLite) and web (IndexedDB).
 */

import Dexie, { Table } from 'dexie';

// Row types matching SQLite schema
interface UserRow {
  id: string;
  name: string;
  email: string | null;
  age: number | null;
  height: number | null;
  height_unit: string;
  weight: number | null;
  bmi: number | null;
  daily_calorie_target: number;
  daily_step_goal: number;
  preferred_weight_unit: string;
  goal_weight: number | null;
  onboarding_completed: string | null;
  created: string;
}

interface WorkoutLogRow {
  id: string;
  user_id: string;
  date: string;
  name: string;
  duration: number | null;
  notes: string | null;
  completed: number;
  created: string;
}

interface ExerciseLogRow {
  id: string;
  workout_id: string;
  exercise_name: string;
  notes: string | null;
  order_index: number;
}

interface SetLogRow {
  id: string;
  exercise_log_id: string;
  reps: number;
  weight: number;
  rpe: number | null;
  completed: number;
  order_index: number;
}

interface DailyNutritionRow {
  id: string;
  user_id: string;
  date: string;
  calorie_target: number;
}

interface MealRow {
  id: string;
  nutrition_id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  time: string;
  preset_id: string | null;
  serving_multiplier: number;
}

interface FoodPresetRow {
  id: string;
  user_id: string;
  name: string;
  serving_size: number;
  serving_unit: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  created_at: string;
  last_used_at: string | null;
}

interface DailyStepsRow {
  id: string;
  user_id: string;
  date: string;
  steps: number;
  step_goal: number;
  source: string;
}

interface DailyWeightRow {
  id: string;
  user_id: string;
  date: string;
  weight: number;
  unit: string;
  source: string;
  created: string;
}

interface PersonalRecordRow {
  id: string;
  user_id: string;
  exercise_name: string;
  weight: number;
  reps: number;
  date: string;
  workout_id: string | null;
  created: string;
}

interface WorkoutTemplateRow {
  id: string;
  user_id: string;
  name: string;
  created: string;
}

interface ExerciseTemplateRow {
  id: string;
  template_id: string;
  exercise_name: string;
  target_sets: number;
  target_reps: number;
  target_weight: number | null;
  order_index: number;
}

interface CustomExerciseRow {
  id: string;
  user_id: string;
  name: string;
  category: string;
  default_sets: number | null;
  default_reps: number | null;
}

interface AchievementRow {
  id: string;
  user_id: string;
  title: string;
  description: string;
  icon: string;
  category: string;
  target_value: number;
  current_value: number;
  is_unlocked: number;
  unlocked_date: string | null;
}

interface SyncQueueRow {
  id?: number;
  table_name: string;
  record_id: string;
  operation: string;
  payload: string | null;
  created_at: string;
  processed_at: string | null;
  error: string | null;
}

interface SyncMetadataRow {
  table_name: string;
  last_sync_at: string | null;
}

interface AppMetaRow {
  key: string;
  value: string;
}

/**
 * Dexie database definition with all tables
 */
class FitAppDB extends Dexie {
  users!: Table<UserRow, string>;
  workout_logs!: Table<WorkoutLogRow, string>;
  exercise_logs!: Table<ExerciseLogRow, string>;
  set_logs!: Table<SetLogRow, string>;
  daily_nutrition!: Table<DailyNutritionRow, string>;
  meals!: Table<MealRow, string>;
  food_presets!: Table<FoodPresetRow, string>;
  daily_steps!: Table<DailyStepsRow, string>;
  daily_weights!: Table<DailyWeightRow, string>;
  personal_records!: Table<PersonalRecordRow, string>;
  workout_templates!: Table<WorkoutTemplateRow, string>;
  exercise_templates!: Table<ExerciseTemplateRow, string>;
  custom_exercises!: Table<CustomExerciseRow, string>;
  achievements!: Table<AchievementRow, string>;
  sync_queue!: Table<SyncQueueRow, number>;
  sync_metadata!: Table<SyncMetadataRow, string>;
  app_meta!: Table<AppMetaRow, string>;

  constructor() {
    super('fitapp');

    this.version(1).stores({
      users: 'id',
      workout_logs: 'id, user_id, date, [user_id+date]',
      exercise_logs: 'id, workout_id, order_index',
      set_logs: 'id, exercise_log_id, order_index',
      daily_nutrition: 'id, user_id, date, [user_id+date]',
      meals: 'id, nutrition_id, time',
      food_presets: 'id, user_id, last_used_at',
      daily_steps: 'id, user_id, date, [user_id+date]',
      daily_weights: 'id, user_id, date, [user_id+date]',
      personal_records: 'id, user_id, exercise_name, [user_id+exercise_name]',
      workout_templates: 'id, user_id, created',
      exercise_templates: 'id, template_id, order_index',
      custom_exercises: 'id, user_id',
      achievements: 'id, user_id',
      sync_queue: '++id, table_name, record_id, processed_at',
      sync_metadata: 'table_name',
      app_meta: 'key',
    });
  }
}

// Singleton database instance
let dbInstance: FitAppDB | null = null;

const getDb = (): FitAppDB => {
  if (!dbInstance) {
    dbInstance = new FitAppDB();
  }
  return dbInstance;
};

/**
 * Parse simple SQL patterns into query components
 */
interface ParsedQuery {
  tableName: string;
  columns: string[];
  whereConditions: Array<{ column: string; operator: string; paramIndex: number }>;
  betweenCondition: { column: string; startIndex: number; endIndex: number } | null;
  orderBy: { column: string; direction: 'ASC' | 'DESC' } | null;
  orderBy2: { column: string; direction: 'ASC' | 'DESC' } | null;
}

const parseSelectQuery = (sql: string): ParsedQuery => {
  const result: ParsedQuery = {
    tableName: '',
    columns: [],
    whereConditions: [],
    betweenCondition: null,
    orderBy: null,
    orderBy2: null,
  };

  // Extract table name
  const fromMatch = sql.match(/FROM\s+(\w+)/i);
  if (fromMatch) {
    result.tableName = fromMatch[1];
  }

  // Extract columns
  const selectMatch = sql.match(/SELECT\s+(.+?)\s+FROM/i);
  if (selectMatch) {
    result.columns = selectMatch[1].split(',').map(c => c.trim());
  }

  // Extract WHERE conditions
  const whereMatch = sql.match(/WHERE\s+(.+?)(?:\s+ORDER|\s*$)/i);
  if (whereMatch) {
    const whereClause = whereMatch[1];

    // Handle BETWEEN
    const betweenMatch = whereClause.match(/(\w+)\s+BETWEEN\s+\?\s+AND\s+\?/i);
    if (betweenMatch) {
      // Count ? before BETWEEN to get param indices
      const beforeBetween = whereClause.substring(0, whereClause.indexOf('BETWEEN'));
      const paramsBefore = (beforeBetween.match(/\?/g) || []).length;
      result.betweenCondition = {
        column: betweenMatch[1],
        startIndex: paramsBefore,
        endIndex: paramsBefore + 1,
      };
    }

    // Handle regular conditions (column = ?)
    const conditions = whereClause.split(/\s+AND\s+/i);
    let paramIndex = 0;
    for (const cond of conditions) {
      if (cond.includes('BETWEEN')) {
        paramIndex += 2; // BETWEEN uses 2 params
        continue;
      }
      const condMatch = cond.match(/(\w+)\s*=\s*\?/);
      if (condMatch) {
        result.whereConditions.push({
          column: condMatch[1],
          operator: '=',
          paramIndex: paramIndex++,
        });
      }
    }
  }

  // Extract ORDER BY
  const orderMatch = sql.match(/ORDER\s+BY\s+(\w+)(?:\s+(ASC|DESC))?(?:\s*,\s*(\w+)(?:\s+(ASC|DESC))?)?/i);
  if (orderMatch) {
    result.orderBy = {
      column: orderMatch[1],
      direction: (orderMatch[2]?.toUpperCase() || 'ASC') as 'ASC' | 'DESC',
    };
    if (orderMatch[3]) {
      result.orderBy2 = {
        column: orderMatch[3],
        direction: (orderMatch[4]?.toUpperCase() || 'ASC') as 'ASC' | 'DESC',
      };
    }
  }

  return result;
};

interface ParsedInsert {
  tableName: string;
  columns: string[];
  isReplace: boolean;
}

const parseInsertQuery = (sql: string): ParsedInsert => {
  const result: ParsedInsert = {
    tableName: '',
    columns: [],
    isReplace: sql.toUpperCase().includes('OR REPLACE'),
  };

  const tableMatch = sql.match(/INTO\s+(\w+)/i);
  if (tableMatch) {
    result.tableName = tableMatch[1];
  }

  const columnsMatch = sql.match(/\(([^)]+)\)\s*VALUES/i);
  if (columnsMatch) {
    result.columns = columnsMatch[1].split(',').map(c => c.trim());
  }

  return result;
};

interface ParsedDelete {
  tableName: string;
  whereColumn: string | null;
}

const parseDeleteQuery = (sql: string): ParsedDelete => {
  const result: ParsedDelete = {
    tableName: '',
    whereColumn: null,
  };

  const tableMatch = sql.match(/FROM\s+(\w+)/i);
  if (tableMatch) {
    result.tableName = tableMatch[1];
  }

  const whereMatch = sql.match(/WHERE\s+(\w+)\s*=/i);
  if (whereMatch) {
    result.whereColumn = whereMatch[1];
  }

  return result;
};

/**
 * SQLite-compatible wrapper for IndexedDB via Dexie
 * Provides the same API as expo-sqlite for seamless integration
 */
export class IndexedDBWrapper {
  private db: FitAppDB;
  private inTransaction: boolean = false;

  constructor() {
    this.db = getDb();
  }

  /**
   * Execute a SELECT query and return all matching rows
   */
  async getAllAsync<T>(sql: string, params: unknown[] = []): Promise<T[]> {
    const parsed = parseSelectQuery(sql);
    const table = this.db.table(parsed.tableName);

    let results: T[];

    // Build query based on conditions
    if (parsed.betweenCondition && parsed.whereConditions.length > 0) {
      // Has both BETWEEN and equality conditions
      const { column, startIndex, endIndex } = parsed.betweenCondition;
      const start = params[startIndex] as string | number;
      const end = params[endIndex] as string | number;

      // First filter by BETWEEN, then by other conditions
      let collection = table.where(column).between(start, end, true, true);

      const filterConditions = parsed.whereConditions;
      results = await collection.filter((row: Record<string, unknown>) => {
        return filterConditions.every(cond => row[cond.column] === params[cond.paramIndex]);
      }).toArray() as T[];
    } else if (parsed.betweenCondition) {
      // Only BETWEEN condition
      const { column, startIndex, endIndex } = parsed.betweenCondition;
      const start = params[startIndex] as string | number;
      const end = params[endIndex] as string | number;
      results = await table.where(column).between(start, end, true, true).toArray() as T[];
    } else if (parsed.whereConditions.length === 1) {
      // Single equality condition
      const cond = parsed.whereConditions[0];
      const value = params[cond.paramIndex] as string | number;
      results = await table.where(cond.column).equals(value).toArray() as T[];
    } else if (parsed.whereConditions.length > 1) {
      // Multiple equality conditions - use compound index if available or filter
      const firstCond = parsed.whereConditions[0];
      const firstValue = params[firstCond.paramIndex] as string | number;
      const collection = table.where(firstCond.column).equals(firstValue);

      const remainingConditions = parsed.whereConditions.slice(1);
      results = await collection.filter((row: Record<string, unknown>) => {
        return remainingConditions.every(cond => row[cond.column] === params[cond.paramIndex]);
      }).toArray() as T[];
    } else {
      // No conditions - return all
      results = await table.toArray() as T[];
    }

    // Apply ordering
    if (parsed.orderBy) {
      const { column, direction } = parsed.orderBy;
      results.sort((a, b) => {
        const aRec = a as Record<string, unknown>;
        const bRec = b as Record<string, unknown>;
        const aVal = aRec[column] as string | number | null;
        const bVal = bRec[column] as string | number | null;
        if (aVal === bVal) {
          // Apply secondary sort if exists
          if (parsed.orderBy2) {
            const col2 = parsed.orderBy2.column;
            const dir2 = parsed.orderBy2.direction;
            const aVal2 = aRec[col2] as string | number | null;
            const bVal2 = bRec[col2] as string | number | null;
            if (aVal2 !== null && bVal2 !== null) {
              if (aVal2 < bVal2) return dir2 === 'ASC' ? -1 : 1;
              if (aVal2 > bVal2) return dir2 === 'ASC' ? 1 : -1;
            }
          }
          return 0;
        }
        if (aVal !== null && bVal !== null) {
          if (aVal < bVal) return direction === 'ASC' ? -1 : 1;
          if (aVal > bVal) return direction === 'ASC' ? 1 : -1;
        }
        return 0;
      });
    }

    return results;
  }

  /**
   * Execute a SELECT query and return the first matching row
   */
  async getFirstAsync<T>(sql: string, params: unknown[] = []): Promise<T | null> {
    const results = await this.getAllAsync<T>(sql, params);
    return results[0] || null;
  }

  /**
   * Execute an INSERT, UPDATE, or DELETE statement
   */
  async runAsync(sql: string, params: unknown[] = []): Promise<void> {
    const upperSql = sql.toUpperCase().trim();

    if (upperSql.startsWith('INSERT')) {
      const parsed = parseInsertQuery(sql);
      const table = this.db.table(parsed.tableName);

      // Build row object from columns and params
      const row: Record<string, unknown> = {};
      parsed.columns.forEach((col, i) => {
        row[col] = params[i];
      });

      if (parsed.isReplace) {
        await table.put(row);
      } else {
        await table.add(row);
      }
    } else if (upperSql.startsWith('DELETE')) {
      const parsed = parseDeleteQuery(sql);
      const table = this.db.table(parsed.tableName);

      if (parsed.whereColumn) {
        const value = params[0] as string;

        // Handle cascade deletes for known relationships
        if (parsed.tableName === 'workout_logs') {
          await this.cascadeDeleteWorkout(value);
        } else if (parsed.tableName === 'daily_nutrition') {
          await this.cascadeDeleteNutrition(value);
        } else if (parsed.tableName === 'workout_templates') {
          await this.cascadeDeleteTemplate(value);
        } else if (parsed.tableName === 'exercise_logs') {
          await this.cascadeDeleteExercise(value);
        } else {
          await table.where(parsed.whereColumn).equals(value).delete();
        }
      } else {
        // Delete all (used in clearDatabase)
        await table.clear();
      }
    } else if (upperSql.startsWith('UPDATE')) {
      // Parse UPDATE table SET col = ? WHERE id = ?
      const tableMatch = sql.match(/UPDATE\s+(\w+)/i);
      const setMatch = sql.match(/SET\s+(.+?)\s+WHERE/i);
      const whereMatch = sql.match(/WHERE\s+(\w+)\s*=\s*\?/i);

      if (tableMatch && setMatch && whereMatch) {
        const tableName = tableMatch[1];
        const table = this.db.table(tableName);
        const whereCol = whereMatch[1];

        // Parse SET clause
        const setClause = setMatch[1];
        const setParts = setClause.split(',').map(s => s.trim());
        const updates: Record<string, unknown> = {};

        let paramIndex = 0;
        for (const part of setParts) {
          const [col] = part.split('=').map(s => s.trim());
          updates[col] = params[paramIndex++];
        }

        const whereValue = params[paramIndex] as string | number;
        await table.where(whereCol).equals(whereValue).modify(updates);
      }
    } else if (upperSql.startsWith('ALTER') || upperSql.startsWith('CREATE') || upperSql.startsWith('PRAGMA')) {
      // DDL statements - no-op for IndexedDB (schema defined in Dexie constructor)
      return;
    }
  }

  /**
   * Execute multiple SQL statements (for schema creation - no-op on IndexedDB)
   */
  async execAsync(_sql: string): Promise<void> {
    // Schema is defined in Dexie constructor, so this is a no-op
    // DDL statements like CREATE TABLE are handled by Dexie versioning
    return;
  }

  /**
   * Execute operations within a transaction
   */
  async withTransactionAsync<T>(fn: () => Promise<T>): Promise<T> {
    if (this.inTransaction) {
      // Already in a transaction, just run the function
      return fn();
    }

    this.inTransaction = true;
    try {
      // Dexie auto-transaction for the tables we're working with
      return await this.db.transaction('rw', this.db.tables, fn);
    } finally {
      this.inTransaction = false;
    }
  }

  /**
   * Cascade delete for workout_logs -> exercise_logs -> set_logs
   */
  private async cascadeDeleteWorkout(workoutId: string): Promise<void> {
    const exercises = await this.db.exercise_logs.where('workout_id').equals(workoutId).toArray();

    for (const exercise of exercises) {
      await this.db.set_logs.where('exercise_log_id').equals(exercise.id).delete();
    }

    await this.db.exercise_logs.where('workout_id').equals(workoutId).delete();
    await this.db.workout_logs.delete(workoutId);
  }

  /**
   * Cascade delete for exercise_logs -> set_logs
   */
  private async cascadeDeleteExercise(exerciseId: string): Promise<void> {
    await this.db.set_logs.where('exercise_log_id').equals(exerciseId).delete();
    await this.db.exercise_logs.delete(exerciseId);
  }

  /**
   * Cascade delete for daily_nutrition -> meals
   */
  private async cascadeDeleteNutrition(nutritionId: string): Promise<void> {
    await this.db.meals.where('nutrition_id').equals(nutritionId).delete();
    await this.db.daily_nutrition.delete(nutritionId);
  }

  /**
   * Cascade delete for workout_templates -> exercise_templates
   */
  private async cascadeDeleteTemplate(templateId: string): Promise<void> {
    await this.db.exercise_templates.where('template_id').equals(templateId).delete();
    await this.db.workout_templates.delete(templateId);
  }
}

// Singleton wrapper instance
let wrapperInstance: IndexedDBWrapper | null = null;

/**
 * Get or create IndexedDB wrapper instance
 */
export const getIndexedDBWrapper = (): IndexedDBWrapper => {
  if (!wrapperInstance) {
    wrapperInstance = new IndexedDBWrapper();
  }
  return wrapperInstance;
};

/**
 * Initialize IndexedDB (called on app startup)
 */
export const initializeIndexedDB = async (): Promise<void> => {
  const db = getDb();
  await db.open();
};
