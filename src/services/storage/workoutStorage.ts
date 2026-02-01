/**
 * Workout storage operations
 */

import { WorkoutLog, ExerciseLog, SetLog } from '../../types';
import { getDb } from './db';
import { generateId } from './utils';
import { syncService } from '../sync';
import { logError, logWarn } from '../../utils/logger';

// Maximum batch size for IN clauses to prevent SQL errors
// SQLite has a default SQLITE_MAX_VARIABLE_NUMBER of 999
const MAX_BATCH_SIZE = 500;

interface WorkoutRow {
  id: string;
  user_id: string;
  date: string;
  name: string;
  duration: number | null;
  notes: string | null;
  completed: number;
  created: string;
}

interface ExerciseRow {
  id: string;
  workout_id: string;
  exercise_name: string;
  notes: string | null;
  order_index: number;
}

interface SetRow {
  exercise_log_id: string;
  reps: number;
  weight: number;
  rpe: number | null;
  completed: number;
  order_index: number;
}

/**
 * Split an array into chunks of a given size
 */
const chunkArray = <T>(array: T[], size: number): T[][] => {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
};

/**
 * Batch load exercises and sets for multiple workouts in 2 queries instead of N+M
 * This eliminates the N+1 query problem
 *
 * Handles large arrays by chunking to respect SQLite's variable limit
 */
const batchLoadWorkoutData = async (workoutIds: string[]): Promise<{
  exercisesByWorkout: Map<string, ExerciseLog[]>;
}> => {
  if (workoutIds.length === 0) {
    return { exercisesByWorkout: new Map() };
  }

  // Warn if array is very large (potential performance issue)
  if (workoutIds.length > MAX_BATCH_SIZE * 2) {
    logWarn(`Large batch load requested: ${workoutIds.length} workouts`, {
      recommendation: 'Consider using pagination',
    });
  }

  const db = await getDb();

  // Chunk workout IDs to respect SQLite variable limit
  const workoutChunks = chunkArray(workoutIds, MAX_BATCH_SIZE);
  const allExerciseRows: ExerciseRow[] = [];

  for (const chunk of workoutChunks) {
    const placeholders = chunk.map(() => '?').join(',');
    const rows = await db.getAllAsync<ExerciseRow>(
      `SELECT id, workout_id, exercise_name, notes, order_index
       FROM exercise_logs
       WHERE workout_id IN (${placeholders})
       ORDER BY workout_id, order_index`,
      chunk
    );
    allExerciseRows.push(...rows);
  }

  if (allExerciseRows.length === 0) {
    return { exercisesByWorkout: new Map() };
  }

  const exerciseIds = allExerciseRows.map(e => e.id);

  // Chunk exercise IDs for sets query
  const exerciseChunks = chunkArray(exerciseIds, MAX_BATCH_SIZE);
  const allSetRows: SetRow[] = [];

  for (const chunk of exerciseChunks) {
    const placeholders = chunk.map(() => '?').join(',');
    const rows = await db.getAllAsync<SetRow>(
      `SELECT exercise_log_id, reps, weight, rpe, completed, order_index
       FROM set_logs
       WHERE exercise_log_id IN (${placeholders})
       ORDER BY exercise_log_id, order_index`,
      chunk
    );
    allSetRows.push(...rows);
  }

  // Group sets by exercise_log_id
  const setsByExercise = new Map<string, SetLog[]>();
  for (const s of allSetRows) {
    const sets = setsByExercise.get(s.exercise_log_id) || [];
    sets.push({
      reps: s.reps,
      weight: s.weight,
      rpe: s.rpe || undefined,
      completed: s.completed === 1,
    });
    setsByExercise.set(s.exercise_log_id, sets);
  }

  // Group exercises by workout_id and attach sets
  const exercisesByWorkout = new Map<string, ExerciseLog[]>();
  for (const ex of allExerciseRows) {
    const exercises = exercisesByWorkout.get(ex.workout_id) || [];
    exercises.push({
      id: ex.id,
      exerciseName: ex.exercise_name,
      notes: ex.notes || undefined,
      sets: setsByExercise.get(ex.id) || [],
    });
    exercisesByWorkout.set(ex.workout_id, exercises);
  }

  return { exercisesByWorkout };
};

/**
 * Convert workout rows to WorkoutLog objects with pre-loaded exercise data
 */
const rowsToWorkoutLogs = (
  rows: WorkoutRow[],
  exercisesByWorkout: Map<string, ExerciseLog[]>
): WorkoutLog[] => {
  return rows.map(row => ({
    id: row.id,
    userId: row.user_id,
    date: row.date,
    name: row.name,
    duration: row.duration || undefined,
    notes: row.notes || undefined,
    completed: row.completed === 1,
    created: row.created,
    exercises: exercisesByWorkout.get(row.id) || [],
  }));
};

// Default page size for pagination
const DEFAULT_PAGE_SIZE = 50;

export const getWorkouts = async (userId: string): Promise<WorkoutLog[]> => {
  try {
    const db = await getDb();
    const rows = await db.getAllAsync<WorkoutRow>(
      'SELECT * FROM workout_logs WHERE user_id = ? ORDER BY date DESC, created DESC',
      [userId]
    );

    // Batch load all exercises and sets in 2 queries instead of N+M
    const workoutIds = rows.map(r => r.id);
    const { exercisesByWorkout } = await batchLoadWorkoutData(workoutIds);

    return rowsToWorkoutLogs(rows, exercisesByWorkout);
  } catch (error) {
    logError('Error getting workouts', error);
    return [];
  }
};

/**
 * Get workouts with pagination support
 */
export const getWorkoutsPaginated = async (
  userId: string,
  limit: number = DEFAULT_PAGE_SIZE,
  offset: number = 0
): Promise<{ workouts: WorkoutLog[]; hasMore: boolean; total: number }> => {
  try {
    const db = await getDb();

    // Get total count
    const countResult = await db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM workout_logs WHERE user_id = ?',
      [userId]
    );
    const total = countResult?.count || 0;

    // Get paginated rows
    const rows = await db.getAllAsync<WorkoutRow>(
      'SELECT * FROM workout_logs WHERE user_id = ? ORDER BY date DESC, created DESC LIMIT ? OFFSET ?',
      [userId, limit, offset]
    );

    // Batch load exercises and sets
    const workoutIds = rows.map(r => r.id);
    const { exercisesByWorkout } = await batchLoadWorkoutData(workoutIds);

    const workouts = rowsToWorkoutLogs(rows, exercisesByWorkout);
    const hasMore = offset + workouts.length < total;

    return { workouts, hasMore, total };
  } catch (error) {
    logError('Error getting paginated workouts', error);
    return { workouts: [], hasMore: false, total: 0 };
  }
};

/**
 * Get workout count for a user (useful for stats without loading all data)
 */
export const getWorkoutCount = async (userId: string): Promise<number> => {
  try {
    const db = await getDb();
    const result = await db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM workout_logs WHERE user_id = ?',
      [userId]
    );
    return result?.count || 0;
  } catch (error) {
    logError('Error getting workout count', error);
    return 0;
  }
};

export const saveWorkout = async (workout: WorkoutLog): Promise<void> => {
  try {
    const db = await getDb();

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

    // Queue for cloud sync (workout_logs table, Supabase expects snake_case)
    await syncService.queueMutation('workout_logs', workout.id, 'UPSERT', {
      id: workout.id,
      user_id: workout.userId,
      date: workout.date,
      name: workout.name,
      duration: workout.duration || null,
      notes: workout.notes || null,
      completed: workout.completed,
      created_at: workout.created,
      updated_at: new Date().toISOString(),
    });
  } catch (error) {
    logError('Error saving workout', error);
    throw error;
  }
};

export const deleteWorkout = async (workoutId: string): Promise<void> => {
  try {
    const db = await getDb();
    // Cascade delete handles exercises and sets
    await db.runAsync('DELETE FROM workout_logs WHERE id = ?', [workoutId]);

    // Queue for cloud sync
    await syncService.queueMutation('workout_logs', workoutId, 'DELETE');
  } catch (error) {
    logError('Error deleting workout', error);
    throw error;
  }
};

export const getWorkoutsByDate = async (date: string, userId: string): Promise<WorkoutLog[]> => {
  try {
    const db = await getDb();
    const rows = await db.getAllAsync<WorkoutRow>(
      'SELECT * FROM workout_logs WHERE date = ? AND user_id = ? ORDER BY created DESC',
      [date, userId]
    );

    const workoutIds = rows.map(r => r.id);
    const { exercisesByWorkout } = await batchLoadWorkoutData(workoutIds);

    return rowsToWorkoutLogs(rows, exercisesByWorkout);
  } catch (error) {
    logError('Error getting workouts by date', error);
    return [];
  }
};

export const getWorkoutsInRange = async (startDate: string, endDate: string, userId: string): Promise<WorkoutLog[]> => {
  try {
    const db = await getDb();
    const rows = await db.getAllAsync<WorkoutRow>(
      'SELECT * FROM workout_logs WHERE date BETWEEN ? AND ? AND user_id = ? ORDER BY date DESC',
      [startDate, endDate, userId]
    );

    const workoutIds = rows.map(r => r.id);
    const { exercisesByWorkout } = await batchLoadWorkoutData(workoutIds);

    return rowsToWorkoutLogs(rows, exercisesByWorkout);
  } catch (error) {
    logError('Error getting workouts in range', error);
    return [];
  }
};
